import { useCallback, useState } from 'react';
import { Keyboard } from 'react-native';

import { useBottomSheetBackButtonSubscription } from './useBottomSheetBackButtonSubscription';

type UseBottomSheetControlsProps = {
    onShowSheet?: () => void;
    onHideSheet?: () => void;
};

export const useBottomSheetControls = ({
    onShowSheet,
    onHideSheet,
}: UseBottomSheetControlsProps = {}) => {
    const [isSheetVisible, setIsSheetVisible] = useState(false);

    const showSheet = useCallback(() => {
        Keyboard.dismiss();
        setIsSheetVisible(true);
        onShowSheet?.();
    }, [onShowSheet]);

    const hideSheet = useCallback(
        (shouldHideKeyboard: boolean = true) => {
            if (shouldHideKeyboard) {
                Keyboard.dismiss();
            }
            setIsSheetVisible(false);
            onHideSheet?.();
        },
        [onHideSheet],
    );

    useBottomSheetBackButtonSubscription(isSheetVisible, hideSheet);

    return {
        isSheetVisible,
        showSheet,
        hideSheet,
    };
};
