import { useCallback, useMemo, useState } from 'react';
import { type LayoutChangeEvent } from 'react-native';

import { nativeSpacings } from '@trezor/theme';

export const LIST_VERTICAL_SPACING = nativeSpacings.sp16;

export const useActiveStepOffset = (activeStep: number) => {
    const [childHeights, setChildHeights] = useState<number[]>([]);

    const activeStepBottomOffset = useMemo(
        () => childHeights.slice(0, activeStep + 1).reduce((offset, height) => offset + height, 0),
        [childHeights, activeStep],
    );

    const handleReadListItemHeight = useCallback((event: LayoutChangeEvent, index: number) => {
        const { height } = event.nativeEvent.layout;

        setChildHeights(prevHeights => {
            const newHeights = [...prevHeights];
            newHeights[index] = height + LIST_VERTICAL_SPACING;

            return newHeights;
        });
    }, []);

    return {
        activeStepBottomOffset,
        handleReadListItemHeight,
    };
};
