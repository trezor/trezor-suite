import React from 'react';

import { Card, HStack } from '@suite-native/atoms';

import { useTradeableAssetsSheetControls } from '../../hooks/useTradeableAssetsSheetControls';
import { SelectTradeableAssetButton } from '../general/SelectTradeableAssetButton';
import { TradeableAssetsSheet } from '../general/TradeableAssetsSheet/TradeableAssetsSheet';

export const AmountCard = () => {
    const {
        isTradeableAssetsSheetVisible,
        showTradeableAssetsSheet,
        hideTradeableAssetsSheet,
        selectedTradeableAsset,
        setSelectedTradeableAsset,
    } = useTradeableAssetsSheetControls();

    return (
        <Card>
            <HStack>
                <SelectTradeableAssetButton
                    onPress={showTradeableAssetsSheet}
                    selectedAsset={selectedTradeableAsset}
                />
            </HStack>
            <TradeableAssetsSheet
                isVisible={isTradeableAssetsSheetVisible}
                onClose={hideTradeableAssetsSheet}
                onAssetSelect={setSelectedTradeableAsset}
            />
        </Card>
    );
};
