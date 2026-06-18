/**
 * Standard screen scaffold: themed background + safe-area aware padding.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';

type Props = {
  children: ReactNode;
  /** When true, content respects the top inset (use when there is no header). */
  withTopInset?: boolean;
};

export function ScreenContainer({ children, withTopInset = false }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.container,
        { paddingTop: withTopInset ? insets.top : 0 },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
