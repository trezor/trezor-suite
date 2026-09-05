import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type TextInput } from 'react-native';
import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { selectHasBitcoinOnlyFirmware } from '@suite-common/device';
import { selectGetSupportedNetworksDep } from '@suite-common/networks';
import { HStack } from '@suite-native/atoms';
import type { FeatureFlagsRootState } from '@suite-native/feature-flags';
import { useWatch } from '@suite-native/forms';
import {
    type TradingRootState,
    buyActions,
    selectBuyTradeableAssets,
} from '@suite-native/trading-state';
import { type TradeableAsset } from '@suite-native/trading-types';
import { noop } from '@trezor/utils';

import { BuyCryptoAmountInput } from './BuyCryptoAmountInput';
import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { useTradeableAssetChange } from '../../hooks/general/form/useTradeableAssetChange';
import { useTradeableAssetPickerNavigation } from '../../hooks/general/useTradeableAssetPickerNavigation';
import { SelectTradeableAssetButton } from '../general/SelectTradeableAssetButton';

const ASSET_PICKER_TEST_ID = '@trading/buy/asset-receive-button';

export const BuyTradeableAssetPicker = () => {
    const inputRef = useRef<TextInput>(null);
    const form = useBuyFormContext();
    const [shouldFocusInput, setShouldFocusInput] = useState<boolean>(false);
    const selectedValue = useWatch({ control: form.control, name: 'asset' });
    const setSelectedValue = useCallback(
        (asset: TradeableAsset) => form.setValue('asset', asset),
        [form],
    );
    const { getSupportedNetworks } = useServices(selectGetSupportedNetworksDep);
    const hasBitcoinOnlyFirmware = useSelector(selectHasBitcoinOnlyFirmware);
    const supportedNetworks = getSupportedNetworks();
    const assets = useSelector((state: TradingRootState & FeatureFlagsRootState) =>
        selectBuyTradeableAssets(state, supportedNetworks),
    );

    const btcAsset = useMemo(() => assets.find(asset => asset.cryptoId === 'bitcoin'), [assets]);

    const changeAsset = useTradeableAssetChange({
        form,
        tradingType: 'buy',
        selectedValue,
        setSelectedValue,
        analyticsParameter: 'cryptoTo',
        amountField: 'cryptoValue',
        getAssetChangedAction: buyActions.assetChanged,
        getAssetTokenChangedAction: buyActions.assetTokenChanged,
    });

    useEffect(() => {
        if (hasBitcoinOnlyFirmware && btcAsset) {
            changeAsset(btcAsset, undefined, { shouldReportAnalytics: false });
        }
    }, [hasBitcoinOnlyFirmware, btcAsset, changeAsset]);

    const onAssetSelect = useCallback(
        (asset: TradeableAsset) => {
            changeAsset(asset);
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

    const showAssetsScreen = useTradeableAssetPickerNavigation({
        assets,
        onAssetSelect,
        tradingType: 'buy',
    });

    const showAssetsScreenAndFocusInput = useCallback(() => {
        setShouldFocusInput(true);
        showAssetsScreen();
    }, [showAssetsScreen]);

    if (hasBitcoinOnlyFirmware) {
        return (
            <HStack justifyContent="space-between" alignItems="center">
                <SelectTradeableAssetButton onPress={noop} selectedAsset={btcAsset} />
                <BuyCryptoAmountInput showAssetsSheet={noop} />
            </HStack>
        );
    }

    return (
        <HStack justifyContent="space-between" alignItems="center">
            <SelectTradeableAssetButton
                onPress={showAssetsScreen}
                selectedAsset={selectedValue}
                caret
                testID={ASSET_PICKER_TEST_ID}
            />
            <BuyCryptoAmountInput ref={inputRef} showAssetsSheet={showAssetsScreenAndFocusInput} />
        </HStack>
    );
};
