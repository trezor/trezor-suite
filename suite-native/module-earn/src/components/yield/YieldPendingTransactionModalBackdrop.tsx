import { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

import { AnimatedView } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { modalSnap } from './YieldPendingTransactionModalConstants';

const backdropStyle = prepareNativeStyle(() => ({
    backgroundColor: '#000000',
}));

export const YieldPendingTransactionModalBackdrop = ({
    animatedIndex,
    style,
}: BottomSheetBackdropProps) => {
    const { applyStyle } = useNativeStyles();

    const animatedBackdropStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            animatedIndex.value,
            [-1, modalSnap.collapsedIndex, modalSnap.expandedIndex],
            [0, modalSnap.collapsedBackdropOpacity, modalSnap.expandedBackdropOpacity],
            Extrapolation.CLAMP,
        ),
    }));

    return (
        <AnimatedView
            pointerEvents="none"
            style={[style, applyStyle(backdropStyle), animatedBackdropStyle]}
        />
    );
};
