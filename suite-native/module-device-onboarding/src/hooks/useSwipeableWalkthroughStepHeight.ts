import { createContext, useContext, useMemo } from 'react';
import { Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getWindowHeight } from '@trezor/env-utils';

export const SwipeableWalkthroughContext = createContext<{ offsetTop: number }>({
    offsetTop: 0,
});

export const useSwipeableWalkthroughStepHeight = () => {
    const { top: topSafeAreaInset, bottom: bottomSafeAreaInset } = useSafeAreaInsets();
    console.log(
        'TCL: useSwipeableWalkthroughStepHeight -> bottomSafeAreaInset',
        bottomSafeAreaInset,
    );
    console.log('TCL: useSwipeableWalkthroughStepHeight -> topSafeAreaInset', topSafeAreaInset);
    const { offsetTop } = useContext(SwipeableWalkthroughContext);
    console.log('TCL: useSwipeableWalkthroughStepHeight -> offsetTop', offsetTop);

    const stepContainerHeight = useMemo(() => {
        let height = getWindowHeight() - offsetTop;

        if (Platform.OS === 'ios') {
            // height = getWindowHeight() - bottomSafeAreaInset - topSafeAreaInset;
            // height -= bottomSafeAreaInset;
            // if (offsetTop > 0) {
            //     height -= topSafeAreaInset;
            // } else {
            //     height -= topSafeAreaInset;
            // }
        }

        return height;
    }, [offsetTop]);

    return stepContainerHeight;
};
