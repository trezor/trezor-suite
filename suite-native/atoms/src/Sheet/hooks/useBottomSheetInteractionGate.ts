import { useState } from 'react';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

// The animated index is an interpolation of the sheet position over its snap points plus the
// closed position, so it only holds a whole number while the sheet rests at one of them. The
// tolerance guards against the interpolation landing a fraction off a snap point and locking
// the sheet for good.
const SETTLED_INDEX_TOLERANCE = 0.001;

/**
 * Tells whether the bottom sheet rests at one of its positions, so that its subtrees can swallow
 * touches while it opens, closes or is being dragged.
 *
 * Without this, an `onPress` fired mid-animation can navigate away while `dismiss()` silently
 * does nothing: `@gorhom/bottom-sheet` learns that the sheet is animating from a callback
 * dispatched from the UI thread, and until that callback lands on the JS thread it still
 * considers the sheet closed and returns early. The sheet then finishes its opening animation
 * on top of the screen that was just navigated to.
 *
 * Pass `animatedIndex` to the underlying `@gorhom/bottom-sheet` component and derive
 * `pointerEvents` of the sheet subtrees from `isSheetSettled`.
 */
export const useBottomSheetInteractionGate = () => {
    const animatedIndex = useSharedValue(-1);
    const [isSheetSettled, setIsSheetSettled] = useState(true);

    useAnimatedReaction(
        () => {
            const nearestIndex = Math.round(animatedIndex.value);

            return Math.abs(animatedIndex.value - nearestIndex) < SETTLED_INDEX_TOLERANCE;
        },
        (isSettled, previousIsSettled) => {
            if (isSettled !== previousIsSettled) {
                scheduleOnRN(setIsSheetSettled, isSettled);
            }
        },
    );

    return { animatedIndex, isSheetSettled };
};
