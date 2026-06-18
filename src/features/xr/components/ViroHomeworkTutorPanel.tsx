/**
 * Floating in-scene tutor panel — shows the current Socratic hint/question for
 * the selected entity (or the learning goal when nothing is selected). Hints,
 * never final answers.
 */
import { ViroFlexView, ViroText, type ViroStyle, type ViroTextStyle } from '@reactvision/react-viro';

const panelStyle: ViroStyle = {
  width: 1.8,
  height: 0.5,
  padding: 0.05,
  flexDirection: 'column',
  backgroundColor: '#141a2add',
};

const textStyle: ViroTextStyle = {
  fontSize: 14,
  color: '#F2F5FF',
  textAlign: 'left',
  textAlignVertical: 'center',
};

export function ViroHomeworkTutorPanel({ text }: { text: string }) {
  return (
    <ViroFlexView position={[0, -0.7, -1.8]} style={panelStyle}>
      <ViroText text={text} style={textStyle} maxLines={4} textLineBreakMode="WordWrap" />
    </ViroFlexView>
  );
}
