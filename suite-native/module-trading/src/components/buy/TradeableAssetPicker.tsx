import { HStack } from '@suite-native/atoms';

import { BuyTradeableAssetsSheet } from './BuyTradeableAssetsSheet';
import { CryptoAmountInput } from './CryptoAmountInput';
import { useTradeSheetControls } from '../../hooks/useTradeSheetControls';
import { useTradingBuyFormContext } from '../../hooks/useTradingBuyFormContext';
import { SelectTradeableAssetButton } from '../general/SelectTradeableAssetButton';

export const TradeableAssetPicker = () => {
    const form = useTradingBuyFormContext();
    const { isSheetVisible, hideSheet, showSheet, setSelectedValue, selectedValue } =
        useTradeSheetControls(form, 'asset');

    return (
        <>
            <HStack justifyContent="space-between" alignItems="center">
                <SelectTradeableAssetButton onPress={showSheet} selectedAsset={selectedValue} />
                <CryptoAmountInput showAssetsSheet={showSheet} />
            </HStack>
            <BuyTradeableAssetsSheet
                isVisible={isSheetVisible}
                onClose={hideSheet}
                onAssetSelect={setSelectedValue}
            />
        </>
    );
};
