/**
 * Settings — wires real Pulsar haptics/sound toggles and surfaces app metadata.
 */
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { Volume2, Vibrate, Waves } from 'lucide-react-native';

import { GradientHeader } from '@/components/GradientHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Colors } from '@/constants/theme';
import { haptics } from '@/lib/haptics';
import { useSettingsStore } from '@/state/settingsStore';

export default function SettingsScreen() {
  const hapticsOn = useSettingsStore((s) => s.hapticsEnabled);
  const soundOn = useSettingsStore((s) => s.soundEnabled);
  const setHapticsEnabled = useSettingsStore((s) => s.setHapticsEnabled);
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled);

  const toggleHaptics = (next: boolean) => {
    setHapticsEnabled(next);
    if (next) {
      haptics.selection();
    }
  };

  return (
    <ScreenContainer>
      <GradientHeader title="Settings" subtitle="Feedback & about" gradient="ember" />
      <ScrollView>
        <View className="gap-4 p-4">
          <View className="rounded-[18px] border border-border bg-surface px-4">
            <View className="flex-row items-center justify-between py-3">
              <View className="flex-row items-center gap-2">
                <Vibrate color={Colors.accent} size={20} />
                <Text className="text-[15px] font-medium text-text">Haptic feedback</Text>
              </View>
              <Switch
                value={hapticsOn}
                onValueChange={toggleHaptics}
                trackColor={{ true: Colors.accent, false: Colors.border }}
                thumbColor={Colors.text}
              />
            </View>
            <View className="h-px bg-border" />
            <View className="flex-row items-center justify-between py-3">
              <View className="flex-row items-center gap-2">
                <Volume2 color={Colors.accent} size={20} />
                <Text className="text-[15px] font-medium text-text">Haptic sound</Text>
              </View>
              <Switch
                value={soundOn}
                onValueChange={setSoundEnabled}
                trackColor={{ true: Colors.accent, false: Colors.border }}
                thumbColor={Colors.text}
              />
            </View>
          </View>

          <Pressable
            className={`flex-row items-center justify-center gap-2 rounded-xl bg-accent py-3 ${
              !hapticsOn ? 'opacity-40' : ''
            }`}
            onPress={() => haptics.success()}
            disabled={!hapticsOn}
          >
            <Waves color={Colors.text} size={18} />
            <Text className="font-bold text-text">Test haptic</Text>
          </Pressable>

          <View className="gap-1 rounded-[18px] border border-border bg-surface p-4">
            <Text className="text-base font-bold text-text">
              {Constants.expoConfig?.name ?? 'Viro Horizon AI'}
            </Text>
            <Text className="text-muted">Version {Constants.expoConfig?.version ?? '1.0.0'}</Text>
            <Text className="text-muted">
              On-device LLM chat, image classification, and ViroReact XR.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
