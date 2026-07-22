import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type TextInput } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { selectHasBitcoinOnlyFirmware } from '@suite-common/device';
import { cryptoIdToSymbol } from '@suite-common/trading';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { HStack } from '@suite-native/atoms';
import { buyActions, selectBuyTradeableAssets } from '@suite-native/trading-state';
import { type TradeableAsset } from '@suite-native/trading-types';
import { noop } from '@trezor/utils';

import { BuyCryptoAmountInput } from './BuyCryptoAmountInput';
import { BuyTradeableAssetsSheet } from './BuyTradeableAssetsSheet';
import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { useSheetControls } from '../../hooks/general/useSheetControls';
import { SelectTradeableAssetButton } from '../general/SelectTradeableAssetButton';

const ASSET_PICKER_TEST_ID = '@trading/buy/asset-receive-button';

export const BuyTradeableAssetPicker = () => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const inputRef = useRef<TextInput>(null);
    const form = useBuyFormContext();
    const [shouldFocusInput, setShouldFocusInput] = useState<boolean>(false);
    const { isSheetVisible, hideSheet, showSheet, setSelectedValue, selectedValue } =
        useSheetControls(form, 'asset');
    const hasBitcoinOnlyFirmware = useSelector(selectHasBitcoinOnlyFirmware);
    const assets = useSelector(selectBuyTradeableAssets);

    const btcAsset = useMemo(() => assets.find(asset => asset.cryptoId === 'bitcoin'), [assets]);

    const changeAsset = useCallback(
        ({
            asset,
            shouldReportAnalytics,
        }: {
            asset: TradeableAsset;
            shouldReportAnalytics: boolean;
        }) => {
            if (asset.cryptoId === selectedValue?.cryptoId) {
                return;
            }

            const previousSymbol = cryptoIdToSymbol(selectedValue?.cryptoId);
            const symbol = cryptoIdToSymbol(asset.cryptoId);

            setSelectedValue(asset);
            form.setValue('cryptoValue', undefined, { shouldValidate: true });
            dispatch(
                previousSymbol === symbol
                    ? buyActions.assetTokenChanged()
                    : buyActions.assetChanged(),
            );

            if (shouldReportAnalytics) {
                analytics.report({
                    type: events.tradingParameterChangedEvent.name,
                    payload: {
                        type: 'buy',
                        parameter: 'cryptoTo',
                    },
                });
            }
        },
        [analytics, dispatch, form, selectedValue?.cryptoId, setSelectedValue],
    );

    useEffect(() => {
        if (hasBitcoinOnlyFirmware && btcAsset) {
            changeAsset({ asset: btcAsset, shouldReportAnalytics: false });
        }
    }, [hasBitcoinOnlyFirmware, btcAsset, changeAsset]);

    const onAssetSelect = useCallback(
        (asset: TradeableAsset) => {
            changeAsset({ asset, shouldReportAnalytics: true });
            if (shouldFocusInput) {
                setShouldFocusInput(false);
                // CryptoAmountInput is rendered disabled allow changes to propagate
                setTimeout(() => {
                    inputRef.current?.focus();
                }, 0);
            }
        },
        [changeAsset, shouldFocusInput],
    );

    const showAssetsSheet = useCallback(() => {
        setShouldFocusInput(true);
        showSheet();
    }, [showSheet]);

    if (hasBitcoinOnlyFirmware) {
        return (
            <HStack justifyContent="space-between" alignItems="center">
                <SelectTradeableAssetButton onPress={noop} selectedAsset={btcAsset} />
                <BuyCryptoAmountInput showAssetsSheet={noop} />
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
                    testID={ASSET_PICKER_TEST_ID}
                />
                <BuyCryptoAmountInput ref={inputRef} showAssetsSheet={showAssetsSheet} />
            </HStack>
            <BuyTradeableAssetsSheet
                isVisible={isSheetVisible}
                onClose={hideSheet}
                onAssetSelect={onAssetSelect}
                hideKeyboardOnAssetSelect={!shouldFocusInput}
            />
        </>
    );
};
