/**
 * Homework scanner — captures a photo with React Native Vision Camera, then
 * extracts the text **on-device** with ExecuTorch OCR (CRAFT). The extracted text
 * is parsed locally into subject/topic/keywords/questions; if OCR yields too
 * little text, it falls back to the Gemini vision parse route.
 *
 * "Load sample" (solar-system) keeps the full flow demoable without camera/keys.
 */
import { useCallback, useRef } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { fetch as expoFetch } from 'expo/fetch';
import * as FileSystem from 'expo-file-system/legacy';
import { useOCR } from 'react-native-executorch';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  usePhotoOutput,
  usePreviewOutput,
  type CameraRef,
} from 'react-native-vision-camera';
import { useRouter } from 'expo-router';
import { Camera as CameraIcon, ScanLine, Sparkles } from 'lucide-react-native';

import { GradientHeader } from '@/components/GradientHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Colors } from '@/constants/theme';
import { generateApiUrl } from '@/lib/api';
import { OCR_MODEL } from '@/lib/executorch';
import { haptics } from '@/lib/haptics';
import { homeworkParseSchema, type HomeworkParseResult } from '@/features/homework/schemas';
import { parseHomeworkText } from '@/features/homework/parseHomeworkText';
import { cropDiagram, enhanceForOcr, preprocessHomeworkImage } from './imagePrep';
import { detectDiagramBox } from './detectDiagram';
import { useHomeworkStore } from '@/features/homework/homeworkStore';
import { buildXRScenePlan } from '@/features/tutor/tutorPrompts';
import type { HomeworkQuestion, HomeworkScan, Subject } from '@/features/homework/types';
import { useScannerStore } from './scannerStore';

const rid = () => Math.random().toString(36).slice(2, 10);

const SAMPLE_PARSE: HomeworkParseResult = {
  subject: 'science',
  topic: 'Solar system',
  keywords: ['solar system', 'planets', 'inner planets', 'outer planets', 'orbit'],
  questions: [
    { prompt: 'Name the inner rocky planets and explain how they differ from the outer gas giants.' },
    { prompt: 'List the planets in order from the Sun.' },
  ],
  diagramBox: null,
};

/** Cloud fallback when on-device OCR can't read enough text. */
async function parseHomeworkImage(imageBase64: string): Promise<HomeworkParseResult> {
  const res = await expoFetch(generateApiUrl('/api/homework/parse'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType: 'image/jpeg' }),
  });
  if (!res.ok) {
    throw new Error(`parse failed (${res.status})`);
  }
  return homeworkParseSchema.parse(await res.json());
}

export default function HomeworkScannerScreen() {
  const router = useRouter();
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const preview = usePreviewOutput();
  const photo = usePhotoOutput();
  const cameraRef = useRef<CameraRef>(null);

  // On-device OCR (downloads on first use).
  const ocr = useOCR({ model: OCR_MODEL });

  const status = useScannerStore((s) => s.status);
  const error = useScannerStore((s) => s.error);
  const setStatus = useScannerStore((s) => s.setStatus);
  const setError = useScannerStore((s) => s.setError);

  const finishScan = useCallback(
    (
      imageUri: string,
      parse: HomeworkParseResult,
      opts?: { referenceImageUri?: string; rodinReferenceImageUri?: string },
    ) => {
      const store = useHomeworkStore.getState();
      const scan: HomeworkScan = {
        id: rid(),
        imageUri,
        referenceImageUri: opts?.referenceImageUri,
        createdAt: new Date().toISOString(),
        subject: parse.subject as Subject,
        topic: parse.topic,
        keywords: parse.keywords.map((k) => k.toLowerCase()),
      };
      const questions: HomeworkQuestion[] = parse.questions.map((q) => ({
        id: rid(),
        prompt: q.prompt,
        rawText: q.rawText,
      }));

      store.setHomeworkScan(scan, questions);
      const plan = buildXRScenePlan(scan, questions, parse);
      // Drive Rodin image-to-3D from the homework diagram crop when we have one.
      if (opts?.rodinReferenceImageUri && plan.rodinGenerationPlan) {
        plan.rodinGenerationPlan.referenceImageUri = opts.rodinReferenceImageUri;
      }
      store.setXRScenePlan(plan);
      if (plan.shouldOfferXR) {
        store.addTutorMessage({ id: rid(), role: 'assistant', content: plan.offerMessage });
      }
      setStatus('idle');
      haptics.success();
      router.navigate('/');
    },
    [router, setStatus],
  );

  const onCapture = useCallback(async () => {
    setStatus('parsing');
    try {
      const file = await photo.capturePhotoToFile({}, {});
      const rawUri = file.filePath.startsWith('file://') ? file.filePath : `file://${file.filePath}`;
      // 1) downscale + compress (preview + light input), 2) grayscale+contrast for OCR.
      const processed = await preprocessHomeworkImage(rawUri).catch(() => ({
        uri: rawUri,
        width: 0,
        height: 0,
      }));
      const enhancedBase64 = await enhanceForOcr(processed.uri).catch(() => null);
      const ocrInput = enhancedBase64 ?? processed.uri;

      let parse: HomeworkParseResult | undefined;
      // Primary: on-device OCR extraction.
      if (ocr.isReady) {
        const detections = await ocr.forward(ocrInput);
        const text = detections.map((d) => d.text).join(' ').trim();
        if (text.length >= 8) {
          parse = parseHomeworkText(text);
          // On-device diagram localization from the OCR boxes.
          parse.diagramBox = detectDiagramBox(detections, processed.width, processed.height);
        }
      }
      // Fallback: cloud vision parse (reuse the enhanced base64 when available).
      if (!parse) {
        const base64 =
          enhancedBase64 ??
          (await FileSystem.readAsStringAsync(processed.uri, {
            encoding: FileSystem.EncodingType.Base64,
          }));
        parse = await parseHomeworkImage(base64);
      }

      // If the homework has an illustration (e.g. a solar-system picture), crop it
      // so it can be shown in XR and used for Rodin image-to-3D.
      const cropUri = parse.diagramBox
        ? await cropDiagram(processed, parse.diagramBox).catch(() => null)
        : null;
      finishScan(processed.uri, parse, {
        referenceImageUri: cropUri ?? processed.uri,
        rodinReferenceImageUri: cropUri ?? undefined,
      });
    } catch {
      setError('Could not read or parse the homework. Try again, or load the sample.');
    }
  }, [photo, ocr, finishScan, setStatus, setError]);

  const loadSample = useCallback(() => {
    finishScan('', SAMPLE_PARSE);
  }, [finishScan]);

  const ocrPct = Math.round(ocr.downloadProgress * 100);

  return (
    <ScreenContainer>
      <GradientHeader title="Scan homework" subtitle="Point at your worksheet" gradient="dusk" />

      <View className="flex-1 gap-4 p-4">
        <View className="flex-1 overflow-hidden rounded-[18px] border border-border bg-surface">
          {hasPermission && device ? (
            <Camera
              ref={cameraRef}
              isActive={status !== 'parsing'}
              device={device}
              outputs={[preview, photo]}
              style={{ flex: 1 }}
            />
          ) : (
            <View className="flex-1 items-center justify-center gap-3 p-6">
              <CameraIcon color={Colors.textMuted} size={40} />
              <Text className="text-center text-muted">
                {hasPermission ? 'No camera device available.' : 'Camera permission is needed to scan homework.'}
              </Text>
              {!hasPermission ? (
                <Pressable
                  className="rounded-xl bg-accent px-4 py-3"
                  onPress={() => requestPermission()}
                >
                  <Text className="font-bold text-text">Grant camera access</Text>
                </Pressable>
              ) : null}
            </View>
          )}

          {status === 'parsing' ? (
            <View className="absolute inset-0 items-center justify-center gap-3 bg-[#0b0f1a]/70">
              <ActivityIndicator color={Colors.accent} />
              <Text className="text-muted">Reading your homework on-device…</Text>
            </View>
          ) : null}
        </View>

        {error ? <Text className="text-center text-danger">{error}</Text> : null}
        {!ocr.isReady && !ocr.error ? (
          <Text className="text-center text-[12px] text-muted">
            Preparing on-device OCR… {ocrPct}% (Gemini is used until it’s ready)
          </Text>
        ) : null}

        <Pressable
          className={`flex-row items-center justify-center gap-2 rounded-xl bg-accent py-4 ${
            !hasPermission || !device || status === 'parsing' ? 'opacity-40' : ''
          }`}
          onPress={onCapture}
          disabled={!hasPermission || !device || status === 'parsing'}
        >
          <ScanLine color={Colors.text} size={20} />
          <Text className="font-bold text-text">Scan homework</Text>
        </Pressable>

        <Pressable
          className="flex-row items-center justify-center gap-2 rounded-xl bg-surface-elevated py-3"
          onPress={loadSample}
        >
          <Sparkles color={Colors.accentAlt} size={18} />
          <Text className="font-semibold text-text">Load sample (solar system)</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
