/**
 * Screen header with a Skia-rendered gradient band + drawer toggle.
 *
 * Skia (`@next`, Graphite backend) paints the gradient; the title/subtitle and
 * the menu button are NativeWind-styled RN layered on top. Width comes from
 * `useWindowDimensions` so the canvas stays correct across orientation changes.
 */
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { Menu } from 'lucide-react-native';

import { Gradients, Colors, type GradientName } from '@/constants/theme';
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
  const { width } = useWindowDimensions();
  const stops = Gradients[gradient];

  const openDrawer = () => {
    haptics.selection();
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <View className="w-full justify-end overflow-hidden" style={{ height }}>
      <Canvas style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Rect x={0} y={0} width={width} height={height}>
          <LinearGradient start={vec(0, 0)} end={vec(width, height)} colors={[...stops]} />
        </Rect>
      </Canvas>
      {showMenu ? (
        <Pressable
          onPress={openDrawer}
          hitSlop={12}
          className="absolute left-4 top-[52px] h-10 w-10 items-center justify-center rounded-full bg-[#0b0f1a]/30"
          accessibilityRole="button"
          accessibilityLabel="Open navigation drawer"
        >
          <Menu color={Colors.text} size={24} />
        </Pressable>
      ) : null}
      <View className="gap-1 p-4">
        <Text className="text-[26px] font-bold text-text">{title}</Text>
        {subtitle ? <Text className="text-sm font-medium text-white/90">{subtitle}</Text> : null}
      </View>
    </View>
  );
}
