import { useState } from 'react';

import { useBottomSheetControls } from './useBottomSheetControls';

export const useTradeSheetControls = <T>() => {
    const bottomSheetControls = useBottomSheetControls();

    const [selectedValue, setSelectedValue] = useState<undefined | T>();

    return {
        selectedValue,
        setSelectedValue,
        ...bottomSheetControls,
    };
};
