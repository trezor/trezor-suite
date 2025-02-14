import { useCallback, useState } from 'react';

export const useBottomSheetControls = () => {
    const [isSheetVisible, setIsSheetVisible] = useState(false);

    const showSheet = useCallback(() => {
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
