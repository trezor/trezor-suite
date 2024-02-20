import { useDerivedValue, withSpring } from 'react-native-reanimated';

import { Circle, Group } from '@shopify/react-native-skia';

import { EventComponentProps } from './LineGraphProps';

const EVENT_SIZE = 4;
const ACTIVE_EVENT_SIZE = 7;

export function DefaultGraphEvent({
    isGraphActive,
    fingerX,
    eventX,
    eventY,
    color,
}: EventComponentProps) {
    const isEventActive = useDerivedValue(
        () => isGraphActive.value && Math.abs(fingerX.value - eventX) < ACTIVE_EVENT_SIZE,
    );

    const dotRadius = useDerivedValue(() =>
        withSpring(isEventActive.value ? ACTIVE_EVENT_SIZE : EVENT_SIZE),
    );

    return (
        <Group>
            <Circle cx={eventX} cy={eventY} r={dotRadius} color={color} />
        </Group>
    );
}
