/**
 * Root layout.
 *
 * Responsibilities:
 *  - Register the ExecuTorch resource fetcher exactly once (on-device AI).
 *  - Enable the Pulsar haptics engine once.
 *  - Provide the outer navigation shell: a Drawer whose first route is the
 *    3-tab Studio group, followed by Models / Profile / Settings.
 */
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Drawer } from 'expo-router/drawer';
import { Boxes, Settings as SettingsIcon, Sparkles, User } from 'lucide-react-native';

import { Colors } from '@/constants/theme';
import { setupExecutorch } from '@/lib/executorch';
import { setupHaptics } from '@/lib/haptics';

export default function RootLayout() {
  useEffect(() => {
    setupHaptics();
    try {
      setupExecutorch();
    } catch (err) {
      // Native runtime is unavailable (e.g. web preview). Model screens
      // surface their own `error` state, so we only log here.
      console.warn('ExecuTorch setup skipped:', err);
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Drawer
          screenOptions={{
            headerShown: false,
            drawerType: 'front',
            drawerActiveTintColor: Colors.accent,
            drawerInactiveTintColor: Colors.textMuted,
            drawerActiveBackgroundColor: Colors.surfaceElevated,
            drawerStyle: { backgroundColor: Colors.surface },
            drawerLabelStyle: { fontSize: 15, fontWeight: '600' },
          }}
        >
          <Drawer.Screen
            name="(tabs)"
            options={{
              drawerLabel: 'Studio',
              title: 'Studio',
              drawerIcon: ({ color, size }) => <Sparkles color={color} size={size} />,
            }}
          />
          <Drawer.Screen
            name="models"
            options={{
              drawerLabel: 'Models',
              title: 'Models',
              drawerIcon: ({ color, size }) => <Boxes color={color} size={size} />,
            }}
          />
          <Drawer.Screen
            name="profile"
            options={{
              drawerLabel: 'Profile',
              title: 'Profile',
              drawerIcon: ({ color, size }) => <User color={color} size={size} />,
            }}
          />
          <Drawer.Screen
            name="settings"
            options={{
              drawerLabel: 'Settings',
              title: 'Settings',
              drawerIcon: ({ color, size }) => <SettingsIcon color={color} size={size} />,
            }}
          />
        </Drawer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
