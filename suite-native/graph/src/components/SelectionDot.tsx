/**
 * This example has removed the outer ring and light
 * shadow from the default one to make it more flat.
 */
import React, { useCallback } from 'react';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import type { SelectionDotProps } from 'react-native-graph';

import { runSpring, useValue, Circle } from '@shopify/react-native-skia';

export const SelectionDot = ({
    isActive,
    color,
    circleX,
    circleY,
}: SelectionDotProps): React.ReactElement => {
    const circleRadius = useValue(0);

    const setIsActive = useCallback(
        (active: boolean) => {
            runSpring(circleRadius, active ? 5 : 0, {
                mass: 1,
                stiffness: 1000,
                damping: 50,
                velocity: 0,
            });
        },
        [circleRadius],
    );

    useAnimatedReaction(
        () => isActive.value,
        active => {
            runOnJS(setIsActive)(active);
        },
        [isActive, setIsActive],
    );

    return <Circle cx={circleX} cy={circleY} r={circleRadius} color={color} />;
};
