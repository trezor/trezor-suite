import { useState } from 'react';

export const useTradeSheetControls = <T>() => {
    const [isSheetVisible, setIsSheetVisible] = useState(false);
    const [selectedValue, setSelectedValue] = useState<undefined | T>();

    const showSheet = () => {
        setIsSheetVisible(true);
    };

    const hideSheet = () => {
        setIsSheetVisible(false);
    };

    return {
        isSheetVisible,
        showSheet,
        hideSheet,
        selectedValue,
        setSelectedValue,
    };
};
