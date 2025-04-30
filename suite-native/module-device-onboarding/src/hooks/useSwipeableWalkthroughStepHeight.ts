import { useMemo } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { atom, useAtomValue, useSetAtom } from 'jotai';

const swipeableWalkthroughStepScrennLayoutHeightAtom = atom(0);

export const useSwipeableWalkthroughStepHeight = () => {
    const stepOffset = useAtomValue(swipeableWalkthroughStepScrennLayoutHeightAtom);
    const setStepLayoutHeight = useSetAtom(swipeableWalkthroughStepScrennLayoutHeightAtom);
    const { bottom, top } = useSafeAreaInsets();

    const swipeableWalkthroughStepHeight = useMemo(
        () => stepOffset + top + (Platform.OS === 'android' ? bottom : 0),
        [bottom, stepOffset, top],
    );

    return { setStepLayoutHeight, swipeableWalkthroughStepHeight };
};
