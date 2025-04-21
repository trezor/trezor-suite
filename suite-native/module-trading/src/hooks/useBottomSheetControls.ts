import { useCallback, useState } from 'react';
import { Keyboard } from 'react-native';

export const useBottomSheetControls = () => {
    const [isSheetVisible, setIsSheetVisible] = useState(false);

    const showSheet = useCallback(() => {
        Keyboard.dismiss();
        setIsSheetVisible(true);
    }, []);

    const hideSheet = useCallback(() => {
        setIsSheetVisible(false);
    }, []);

    return {
        isSheetVisible,
        showSheet,
        hideSheet,
    };
};
