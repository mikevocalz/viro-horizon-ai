/**
 * RN overlay above the Viro scene showing live Rodin generation progress. Hidden
 * once the model is ready. The scene stays fully interactive underneath.
 */
import { Text, View } from 'react-native';

import { useHomeworkStore } from '@/features/homework/homeworkStore';

export function XRGenerationStatusPanel() {
  const job = useHomeworkStore((s) => s.xrGenerationJob);
  if (!job || job.status === 'ready') {
    return null;
  }
  const pct = Math.round(job.progress * 100);
  const failed = job.status === 'failed';
  return (
    <View className="absolute left-4 right-4 top-4 gap-2 rounded-[18px] border border-border bg-[#0b0f1a]/85 p-4">
      <Text className="font-bold text-text">Building your homework XR model</Text>
      <Text className={failed ? 'text-danger' : 'text-muted'}>
        {failed ? (job.error ?? 'Generation failed') : `${job.message} · ${pct}%`}
      </Text>
      {!failed ? (
        <View className="h-2 overflow-hidden rounded-full bg-surface-elevated">
          <View className="h-full rounded-full bg-accent" style={{ width: `${Math.max(4, pct)}%` }} />
        </View>
      ) : null}
      <Text className="text-[12px] text-muted">
        You can start exploring while the full model builds
      </Text>
    </View>
  );
}
