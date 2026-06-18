/**
 * Standard screen scaffold: themed background + safe-area aware padding.
 */
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  children: ReactNode;
  /** When true, content respects the top inset (use when there is no header). */
  withTopInset?: boolean;
};

export function ScreenContainer({ children, withTopInset = false }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-1 bg-background"
      style={withTopInset ? { paddingTop: insets.top } : undefined}
    >
      {children}
    </View>
  );
}
