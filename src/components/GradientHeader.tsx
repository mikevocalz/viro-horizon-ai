/**
 * Screen header with a Skia-rendered gradient band + drawer toggle.
 *
 * Skia (`@next`, Graphite backend) paints the gradient; the title/subtitle and
 * the menu button are standard RN layered on top. Width is captured via
 * `onLayout` so the canvas stays correct across orientation changes
 * (orientation is "default").
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { Menu } from 'lucide-react-native';

import { Gradients, Colors, Spacing, type GradientName } from '@/constants/theme';
import { haptics } from '@/lib/haptics';

type Props = {
  title: string;
  subtitle?: string;
  gradient?: GradientName;
  height?: number;
  /** Show the hamburger button that opens the outer drawer. Default true. */
  showMenu?: boolean;
};

export function GradientHeader({
  title,
  subtitle,
  gradient = 'brand',
  height = 140,
  showMenu = true,
}: Props) {
  const navigation = useNavigation();
  const [width, setWidth] = useState(0);
  const stops = Gradients[gradient];

  const openDrawer = () => {
    haptics.selection();
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <View
      style={[styles.container, { height }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 ? (
        <Canvas style={StyleSheet.absoluteFill}>
          <Rect x={0} y={0} width={width} height={height}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(width, height)}
              colors={[...stops]}
            />
          </Rect>
        </Canvas>
      ) : null}
      {showMenu ? (
        <Pressable
          onPress={openDrawer}
          hitSlop={12}
          style={styles.menuButton}
          accessibilityRole="button"
          accessibilityLabel="Open navigation drawer"
        >
          <Menu color={Colors.text} size={24} />
        </Pressable>
      ) : null}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  menuButton: {
    position: 'absolute',
    top: 52,
    left: Spacing.lg,
    height: 40,
    width: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,15,26,0.28)',
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  title: {
    color: Colors.text,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
});
