import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectHasBitcoinOnlyFirmware } from '@suite-common/wallet-core';
import { HStack } from '@suite-native/atoms';

import { BuyTradeableAssetsSheet } from './BuyTradeableAssetsSheet';
import { CryptoAmountInput } from './CryptoAmountInput';
import { useTradeSheetControls } from '../../hooks/useTradeSheetControls';
import { useTradingBuyFormContext } from '../../hooks/useTradingBuyFormContext';
import { selectBuyTradeableAssetsSorted } from '../../selectors/buySelectors';
import { SelectTradeableAssetButton } from '../general/SelectTradeableAssetButton';

const noop = () => {};

export const TradeableAssetPicker = () => {
    const form = useTradingBuyFormContext();
    const { isSheetVisible, hideSheet, showSheet, setSelectedValue, selectedValue } =
        useTradeSheetControls(form, 'asset');
    const hasBitcoinOnlyFirmware = useSelector(selectHasBitcoinOnlyFirmware);
    const assets = useSelector(selectBuyTradeableAssetsSorted);

    const btcAsset = useMemo(() => assets.find(asset => asset.cryptoId === 'bitcoin'), [assets]);

    useEffect(() => {
        if (hasBitcoinOnlyFirmware && selectedValue?.cryptoId !== btcAsset?.cryptoId) {
            setSelectedValue(btcAsset);
        }
    }, [hasBitcoinOnlyFirmware, btcAsset, selectedValue, setSelectedValue]);

    if (hasBitcoinOnlyFirmware) {
        return (
            <HStack justifyContent="space-between" alignItems="center">
                <SelectTradeableAssetButton onPress={noop} selectedAsset={btcAsset} />
                <CryptoAmountInput showAssetsSheet={noop} />
            </HStack>
        );
    }

    return (
        <>
            <HStack justifyContent="space-between" alignItems="center">
                <SelectTradeableAssetButton
                    onPress={showSheet}
                    selectedAsset={selectedValue}
                    caret
                />
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
