import { useState } from 'react';

import { TradeableAsset } from '../types';

export const useTradeableAssetsSheetControls = () => {
    const [isTradeableAssetsSheetVisible, setIsTradeableAssetsSheetVisible] = useState(false);
    const [selectedTradeableAsset, setSelectedTradeableAsset] = useState<
        undefined | TradeableAsset
    >();

    const showTradeableAssetsSheet = () => {
        setIsTradeableAssetsSheetVisible(true);
    };

    const hideTradeableAssetsSheet = () => {
        setIsTradeableAssetsSheetVisible(false);
    };

    return {
        isTradeableAssetsSheetVisible,
        showTradeableAssetsSheet,
        hideTradeableAssetsSheet,
        selectedTradeableAsset,
        setSelectedTradeableAsset,
    };
};
