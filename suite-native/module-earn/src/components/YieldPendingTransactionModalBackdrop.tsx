import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import {
    YIELD_PENDING_TRANSACTION_MODAL_COLLAPSED_BACKDROP_OPACITY,
    YIELD_PENDING_TRANSACTION_MODAL_COLLAPSED_INDEX,
    YIELD_PENDING_TRANSACTION_MODAL_EXPANDED_BACKDROP_OPACITY,
    YIELD_PENDING_TRANSACTION_MODAL_EXPANDED_INDEX,
} from './YieldPendingTransactionModalConstants';

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
            [
                -1,
                YIELD_PENDING_TRANSACTION_MODAL_COLLAPSED_INDEX,
                YIELD_PENDING_TRANSACTION_MODAL_EXPANDED_INDEX,
            ],
            [
                0,
                YIELD_PENDING_TRANSACTION_MODAL_COLLAPSED_BACKDROP_OPACITY,
                YIELD_PENDING_TRANSACTION_MODAL_EXPANDED_BACKDROP_OPACITY,
            ],
            Extrapolation.CLAMP,
        ),
    }));

    return (
        <Animated.View
            pointerEvents="none"
            style={[style, applyStyle(backdropStyle), animatedBackdropStyle]}
        />
    );
};
