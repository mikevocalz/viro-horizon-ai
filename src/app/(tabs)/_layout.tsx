/**
 * Studio tab group — the first route inside the outer drawer.
 *
 *  1. Chat      — on-device LLM chat (ExecuTorch)
 *  2. Classify  — on-device image classification (ExecuTorch)
 *  3. XR        — ViroReact immersive layer
 *
 * Every tab press fires a Pulsar selection haptic.
 */
import { Tabs } from 'expo-router';
import { Box, MessageCircle, ScanEye } from 'lucide-react-native';

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
          title: 'Chat',
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
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
