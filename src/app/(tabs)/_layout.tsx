/**
 * Studio tab group — the first route inside the outer drawer.
 *
 *  1. Tutor     — homework tutor (on-device ExecuTorch + online Gemini fallback)
 *  2. Scan      — homework scanner (React Native Vision Camera)
 *  3. Classify  — on-device image classification (ExecuTorch)
 *  4. XR        — homework-driven generated ViroReact scene
 *
 * Every tab press fires a Pulsar selection haptic.
 */
import { Tabs } from 'expo-router';
import { Box, GraduationCap, ScanEye, ScanLine } from 'lucide-react-native';

import { Colors } from '@/constants/theme';
import { haptics } from '@/lib/haptics';

export default function TabsLayout() {
  return (
    <Tabs
      screenListeners={{
        tabPress: () => {
          haptics.selection();
        },
      }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tutor',
          tabBarIcon: ({ color, size }) => <GraduationCap color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color, size }) => <ScanLine color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="classify"
        options={{
          title: 'Classify',
          tabBarIcon: ({ color, size }) => <ScanEye color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="xr"
        options={{
          title: 'XR',
          tabBarIcon: ({ color, size }) => <Box color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
