/**
 * Homework scanner — captures a photo with React Native Vision Camera, sends it
 * to the tutor LLM to parse (subject/topic/keywords/questions), builds the XR
 * scene plan, seeds the tutor with an offer message, then routes to the Tutor.
 *
 * Works offline via "Load sample" (solar-system) so the full flow is demoable
 * without camera or API keys.
 */
import { useCallback, useRef } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { fetch as expoFetch } from 'expo/fetch';
import * as FileSystem from 'expo-file-system/legacy';
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
import { haptics } from '@/lib/haptics';
import { homeworkParseSchema, type HomeworkParseResult } from '@/features/homework/schemas';
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
};

async function parseHomework(imageBase64: string): Promise<HomeworkParseResult> {
  const res = await expoFetch(generateApiUrl('/api/homework/parse'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType: 'image/jpeg' }),
  });
  if (!res.ok) {
    throw new Error(`parse failed (${res.status})`);
  }
  const json = await res.json();
  return homeworkParseSchema.parse(json);
}

export default function HomeworkScannerScreen() {
  const router = useRouter();
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const preview = usePreviewOutput();
  const photo = usePhotoOutput();
  const cameraRef = useRef<CameraRef>(null);

  const status = useScannerStore((s) => s.status);
  const error = useScannerStore((s) => s.error);
  const setStatus = useScannerStore((s) => s.setStatus);
  const setError = useScannerStore((s) => s.setError);

  const finishScan = useCallback(
    (imageUri: string, parse: HomeworkParseResult) => {
      const store = useHomeworkStore.getState();
      const scan: HomeworkScan = {
        id: rid(),
        imageUri,
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
      const uri = file.filePath.startsWith('file://') ? file.filePath : `file://${file.filePath}`;
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const parse = await parseHomework(base64);
      finishScan(uri, parse);
    } catch {
      setError('Could not read or parse the homework. Check your connection, or load the sample.');
    }
  }, [photo, finishScan, setStatus, setError]);

  const loadSample = useCallback(() => {
    finishScan('', SAMPLE_PARSE);
  }, [finishScan]);

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
              <Text className="text-muted">Reading your homework…</Text>
            </View>
          ) : null}
        </View>

        {error ? <Text className="text-center text-danger">{error}</Text> : null}

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
