import {
    useAnimatedReaction,
    useDerivedValue,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

import { vec, Circle, Group, Line } from '@shopify/react-native-skia';

import type { SelectionDotProps } from '@suite-native/react-native-graph';

const LINE_LENGTH = 3000;
const LINE_WIDTH = 0.5;
const LINE_HIDDEN_WIDTH = 1e-9;
const CIRCLE_RADIUS = 5;

const springAnimationConfig = {
    mass: 0.2,
};

export const SelectionDotWithLine = ({ isActive, color, circleX, circleY }: SelectionDotProps) => {
    const circleRadius = useSharedValue(0);
    const lineWidth = useSharedValue(LINE_HIDDEN_WIDTH);

    const lineStart = useDerivedValue(() => vec(circleX.value, 0));
    const lineEnd = useDerivedValue(() => vec(circleX.value, LINE_LENGTH));

    useAnimatedReaction(
        () => isActive.value,
        active => {
            circleRadius.value = withSpring(active ? CIRCLE_RADIUS : 0, springAnimationConfig);
            lineWidth.value = withSpring(
                active ? LINE_WIDTH : LINE_HIDDEN_WIDTH,
                springAnimationConfig,
            );
        },
        [isActive],
    );

    return (
        <Group>
            <Circle cx={circleX} cy={circleY} r={circleRadius} color={color} />
            <Line p1={lineStart} p2={lineEnd} strokeWidth={lineWidth} color={color} />
        </Group>
    );
};
