import { type RefObject, useCallback, useEffect, useMemo, useRef } from 'react';
import { type TextInput } from 'react-native';
import { useSelector } from 'react-redux';

import { selectHasBitcoinOnlyFirmware } from '@suite-common/device';
import { HStack } from '@suite-native/atoms';
import { useWatch } from '@suite-native/forms';
import { buyActions, selectBuyTradeableAssets } from '@suite-native/trading-state';
import { type TradeableAsset } from '@suite-native/trading-types';
import { noop } from '@trezor/utils';

import { BuyBaseCurrencyAmountInput } from './BuyBaseCurrencyAmountInput';
import { BuyCryptoAmountInput } from './BuyCryptoAmountInput';
import { BuyReceiveAccountCryptoBalance } from './BuyReceiveAccountCryptoBalance';
import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { useTradeableAssetChange } from '../../hooks/general/form/useTradeableAssetChange';
import { useAssetSelectInputFocus } from '../../hooks/general/useAssetSelectInputFocus';
import { useTradeableAssetPickerNavigation } from '../../hooks/general/useTradeableAssetPickerNavigation';
import { TradeableAssetButton } from '../general/TradeableAssetButton';

const ASSET_PICKER_TEST_ID = '@trading/buy/asset-receive-button';

export const BuyTradeableAssetPicker = () => {
    const cryptoInputRef = useRef<TextInput>(null);
    const baseCurrencyInputRef = useRef<TextInput>(null);
    const form = useBuyFormContext();
    const { requestInputFocus, focusRequestedInput } = useAssetSelectInputFocus();
    const selectedValue = useWatch({ control: form.control, name: 'asset' });
    const setSelectedValue = useCallback(
        (asset: TradeableAsset) => form.setValue('asset', asset),
        [form],
    );
    const hasBitcoinOnlyFirmware = useSelector(selectHasBitcoinOnlyFirmware);
    const assets = useSelector(selectBuyTradeableAssets);

    const btcAsset = useMemo(() => assets.find(asset => asset.cryptoId === 'bitcoin'), [assets]);

    const changeAsset = useTradeableAssetChange({
        form,
        tradingType: 'buy',
        selectedValue,
        setSelectedValue,
        analyticsParameter: 'cryptoTo',
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
            focusRequestedInput();
        },
        [changeAsset, focusRequestedInput],
    );

    const showAssetsScreen = useTradeableAssetPickerNavigation({
        assets,
        onAssetSelect,
        tradingType: 'buy',
    });

    const showAssetsScreenAndFocusInput = useCallback(
        (inputRef: RefObject<TextInput | null>) => {
            requestInputFocus(inputRef);
            showAssetsScreen();
        },
        [showAssetsScreen, requestInputFocus],
    );

    if (hasBitcoinOnlyFirmware) {
        return (
            <>
                <HStack justifyContent="space-between" alignItems="center">
                    <BuyCryptoAmountInput showAssetsSheet={noop} />
                    <TradeableAssetButton onPress={noop} selectedAsset={btcAsset} />
                </HStack>
                <HStack justifyContent="space-between" alignItems="center" spacing="sp4">
                    <BuyBaseCurrencyAmountInput showAssetsSheet={noop} />
                    <BuyReceiveAccountCryptoBalance />
                </HStack>
            </>
        );
    }

    return (
        <>
            <HStack justifyContent="space-between" alignItems="center">
                <BuyCryptoAmountInput
                    ref={cryptoInputRef}
                    showAssetsSheet={() => showAssetsScreenAndFocusInput(cryptoInputRef)}
                />
                <TradeableAssetButton
                    onPress={showAssetsScreen}
                    selectedAsset={selectedValue}
                    caret
                    testID={ASSET_PICKER_TEST_ID}
                />
            </HStack>
            <HStack justifyContent="space-between" alignItems="center" spacing="sp4">
                <BuyBaseCurrencyAmountInput
                    ref={baseCurrencyInputRef}
                    showAssetsSheet={() => showAssetsScreenAndFocusInput(baseCurrencyInputRef)}
                />
                <BuyReceiveAccountCryptoBalance />
            </HStack>
        </>
    );
};
