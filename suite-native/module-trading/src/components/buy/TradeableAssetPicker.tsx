import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TextInput } from 'react-native';
import { useSelector } from 'react-redux';

import { selectHasBitcoinOnlyFirmware } from '@suite-common/wallet-core';
import { HStack } from '@suite-native/atoms';

import { BuyTradeableAssetsSheet } from './BuyTradeableAssetsSheet';
import { CryptoAmountInput } from './CryptoAmountInput';
import { useTradeSheetControls } from '../../hooks/useTradeSheetControls';
import { useTradingBuyFormContext } from '../../hooks/useTradingBuyFormContext';
import { selectBuyTradeableAssetsSorted } from '../../selectors/buySelectors';
import { TradeableAsset } from '../../types';
import { SelectTradeableAssetButton } from '../general/SelectTradeableAssetButton';

const noop = () => {};

export const TradeableAssetPicker = () => {
    const inputRef = useRef<TextInput>(null);
    const form = useTradingBuyFormContext();
    const [shouldFocusInput, setShouldFocusInput] = useState<boolean>(false);
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

    const onAssetSelect = useCallback(
        (asset: TradeableAsset) => {
            setSelectedValue(asset);
            if (shouldFocusInput) {
                setShouldFocusInput(false);
                // CryptoAmountInput is rendered disabled allow changes to propagate.
                setTimeout(() => {
                    inputRef.current?.focus();
                }, 0);
            }
        },
        [shouldFocusInput, setSelectedValue],
    );

    const showAssetsSheet = useCallback(() => {
        setShouldFocusInput(true);
        showSheet();
    }, [showSheet]);

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
                <CryptoAmountInput ref={inputRef} showAssetsSheet={showAssetsSheet} />
            </HStack>
            <BuyTradeableAssetsSheet
                isVisible={isSheetVisible}
                onClose={hideSheet}
                onAssetSelect={onAssetSelect}
            />
        </>
    );
};
