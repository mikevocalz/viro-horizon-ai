/**
 * Profile — identity placeholder plus live device + Horizon diagnostics.
 */
import { ScrollView, Text, View } from 'react-native';
import * as Device from 'expo-device';
import { Headset, Smartphone, User } from 'lucide-react-native';

import { GradientHeader } from '@/components/GradientHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Colors } from '@/constants/theme';
import { getHorizonAppId, isHorizonBuild, isHorizonDevice } from '@/lib/horizon';

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-3">
      <Text className="text-muted">{label}</Text>
      <Text className="shrink text-right font-medium text-text">{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const onHorizon = isHorizonDevice();

  return (
    <ScreenContainer>
      <GradientHeader title="Profile" subtitle="Your device & session" gradient="dusk" />
      <ScrollView>
        <View className="gap-4 p-4">
          <View className="items-center gap-1 py-3">
            <View className="mb-2 h-[84px] w-[84px] items-center justify-center rounded-full bg-surface-elevated">
              <User color={Colors.text} size={34} />
            </View>
            <Text className="text-xl font-bold text-text">Local User</Text>
            <Text className="text-muted">Everything runs on this device</Text>
          </View>

          <View className="gap-2 rounded-[18px] border border-border bg-surface p-4">
            <View className="mb-1 flex-row items-center gap-2">
              <Smartphone color={Colors.accent} size={20} />
              <Text className="text-[15px] font-bold text-text">Device</Text>
            </View>
            <Fact label="Name" value={Device.deviceName ?? 'Unknown'} />
            <Fact label="Model" value={Device.modelName ?? 'Unknown'} />
            <Fact label="Brand" value={Device.brand ?? 'Unknown'} />
            <Fact
              label="OS"
              value={`${Device.osName ?? 'Unknown'} ${Device.osVersion ?? ''}`.trim()}
            />
            <Fact label="Physical device" value={Device.isDevice ? 'Yes' : 'No (simulator)'} />
          </View>

          <View className="gap-2 rounded-[18px] border border-border bg-surface p-4">
            <View className="mb-1 flex-row items-center gap-2">
              <Headset color={Colors.accentAlt} size={20} />
              <Text className="text-[15px] font-bold text-text">Horizon OS</Text>
            </View>
            <Fact label="Horizon device" value={onHorizon ? 'Yes' : 'No'} />
            <Fact label="Horizon build" value={isHorizonBuild() ? 'Yes' : 'No'} />
            <Fact label="Horizon app id" value={getHorizonAppId() ?? '—'} />
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
