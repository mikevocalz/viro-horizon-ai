/**
 * In-tutor offer card. Rendered when the active homework has an XR scene plan
 * with `shouldOfferXR`. Tapping it routes to the XR tab, marks the offer opened,
 * and kicks off Rodin generation (idempotently).
 */
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Boxes, Sparkles } from 'lucide-react-native';

import { Colors } from '@/constants/theme';
import { haptics } from '@/lib/haptics';
import { useHomeworkStore } from '@/features/homework/homeworkStore';
import { runXRGeneration } from '@/services/xr/xrGenerationClient';

export function XRStudyCTA() {
  const router = useRouter();
  const plan = useHomeworkStore((s) => s.xrScenePlan);
  const startXRGeneration = useHomeworkStore((s) => s.startXRGeneration);
  const openXRForHomework = useHomeworkStore((s) => s.openXRForHomework);

  if (!plan || !plan.shouldOfferXR) {
    return null;
  }

  const onPress = () => {
    haptics.immersive();
    openXRForHomework();
    router.navigate('/xr');
    if (plan.rodinGenerationPlan && startXRGeneration()) {
      void runXRGeneration(plan.rodinGenerationPlan);
    }
  };

  return (
    <View className="mx-4 mb-2 gap-2 rounded-[18px] border border-accent/40 bg-surface-elevated p-4">
      <View className="flex-row items-center gap-2">
        <Sparkles color={Colors.accentAlt} size={18} />
        <Text className="text-[13px] font-semibold text-accent-alt">AI Tutor</Text>
      </View>
      <Text className="text-[15px] leading-5 text-text">{plan.offerMessage}</Text>
      <Pressable
        className="mt-1 flex-row items-center justify-center gap-2 rounded-xl bg-accent py-3"
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={plan.ctaLabel}
      >
        <Boxes color={Colors.text} size={20} />
        <Text className="font-bold text-text">{plan.ctaLabel}</Text>
      </Pressable>
      <Text className="text-center text-[12px] text-muted">
        Builds a 3D model from your homework
      </Text>
    </View>
  );
}
