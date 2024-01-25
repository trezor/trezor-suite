import { useCallback, useRef, useState } from 'react';
import { Dimensions, View } from 'react-native';

import { useFocusEffect } from '@react-navigation/native';

import { useDiscreetMode } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { FiatAmountFormatter } from '@suite-native/formatters';

type AxisLabelProps = {
    x: number;
    value: number;
};

type AxisLabelStyleProps = {
    x: number;
    isOverflowing: boolean;
};
// Default react-navigation screen transition animation duration is equal to 350.
// https://reactnavigation.org/docs/native-stack-navigator/#animationduration
const SCREEN_TRANSITION_ANIMATION_DURATION = 350;

const SCREEN_WIDTH = Dimensions.get('screen').width;

const axisLabelStyle = prepareNativeStyle<AxisLabelStyleProps>(
    ({ spacings }, { x, isOverflowing }) => ({
        position: 'absolute',
        left: `${x}%`,
        extend: {
            // Position the axis label from the right if it's overflowing the screen width.
            condition: isOverflowing,
            style: {
                left: undefined,
                right: spacings.small,
            },
        },
    }),
);

export const AxisLabel = ({ x, value }: AxisLabelProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const { isDiscreetMode } = useDiscreetMode();
    const viewRef = useRef<View>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);

    const handleLayoutOverflow = useCallback(() => {
        if (viewRef.current) {
            viewRef.current.measureInWindow((viewX, _, viewWidth) => {
                const graphHorizontalPadding = utils.spacings.small;
                // The right most pixel of the axis label is overflowing the graph width.
                if (viewX + viewWidth + graphHorizontalPadding > SCREEN_WIDTH) {
                    setIsOverflowing(true);
                }
            });
        }
    }, [utils]);

    // We need to check the axis overflow on every return to a already rendered graph screen, because it might be shifted by the previous screen transition animation.
    // The timeout is needed because the calculation has to be started after the screen transition animation is finished.
    useFocusEffect(() => {
        const timeoutId = setTimeout(handleLayoutOverflow, SCREEN_TRANSITION_ANIMATION_DURATION);

        return () => clearTimeout(timeoutId);
    });

    if (isDiscreetMode) return null;

    return (
        <View
            style={applyStyle(axisLabelStyle, { x, isOverflowing })}
            onLayout={handleLayoutOverflow}
            ref={viewRef}
        >
            <FiatAmountFormatter value={String(value)} variant="label" color="textDisabled" />
        </View>
    );
};
