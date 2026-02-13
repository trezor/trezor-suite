import { useCallback, useState } from 'react';
import { Keyboard } from 'react-native';

import { useBottomSheetBackButtonSubscription } from './useBottomSheetBackButtonSubscription';

export const useBottomSheetControls = () => {
    const [isSheetVisible, setIsSheetVisible] = useState(false);

    const showSheet = useCallback(() => {
        Keyboard.dismiss();
        setIsSheetVisible(true);
    }, []);

    const hideSheet = useCallback((shouldHideKeyboard: boolean = true) => {
        if (shouldHideKeyboard) {
            Keyboard.dismiss();
        }
        setIsSheetVisible(false);
    }, []);

    useBottomSheetBackButtonSubscription(isSheetVisible, hideSheet);

    return {
        isSheetVisible,
        showSheet,
        hideSheet,
    };
};
