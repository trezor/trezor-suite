import { useCallback, useRef, useState } from 'react';
import { type TextInput } from 'react-native';

import { tradingExchangeActions } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
import { HStack } from '@suite-native/atoms';
import { useWatch } from '@suite-native/forms';
import { exchangeActions } from '@suite-native/trading-state';
import { type TradeableAsset } from '@suite-native/trading-types';

import { ExchangeSendAmountInput } from './ExchangeSendAmountInput';
import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { useTradeableAssetChange } from '../../../hooks/general/form/useTradeableAssetChange';
import { useMyAssetPickerNavigation } from '../../../hooks/general/useMyAssetPickerNavigation';
import { useTradingMyAssets } from '../../../hooks/general/useTradingMyAssets';
import { SelectTradeableAssetButton } from '../../general/SelectTradeableAssetButton';

const ASSET_PICKER_TEST_ID = '@trading/exchange/asset-send-button';

// Selecting a send asset that equals the receive asset clears the receive side. `sendAssetChanged`
// alone would leave the stale receive account behind, so the collision resets the receive asset too.
const SEND_ASSET_COLLISION = {
    counterpartAssetField: 'receiveAsset',
    counterpartAnalyticsParameter: 'cryptoTo',
    getCounterpartChangedAction: exchangeActions.receiveAssetChanged,
} as const;

export const ExchangeSendAssetPicker = () => {
    const inputRef = useRef<TextInput>(null);
    const form = useExchangeFormContext();
    const [shouldFocusInput, setShouldFocusInput] = useState<boolean>(false);
    const myAssets = useTradingMyAssets('exchange');
    const selectedValue = useWatch({ control: form.control, name: 'sendAsset' });
    const setSelectedValue = useCallback(
        (asset: TradeableAsset) => form.setValue('sendAsset', asset),
        [form],
    );

    const changeAsset = useTradeableAssetChange({
        form,
        tradingType: 'exchange',
        selectedValue,
        setSelectedValue,
        analyticsParameter: 'cryptoFrom',
        amountField: 'sendCryptoAmount',
        getAssetChangedAction: exchangeActions.sendAssetChanged,
        getSetTradingAccountKeyAction: tradingExchangeActions.setTradingAccountKey,
        collision: SEND_ASSET_COLLISION,
    });

    const onAssetSelect = useCallback(
        (asset: TradeableAsset, account: Account) => {
            changeAsset(asset, account);

            if (shouldFocusInput) {
                setShouldFocusInput(false);
                // CryptoAmountInput is rendered disabled allow changes to propagate.
                setTimeout(() => {
                    inputRef.current?.focus();
                }, 0);
            }
        },
        [changeAsset, shouldFocusInput],
    );

    const openAssetPicker = useMyAssetPickerNavigation({
        assets: myAssets,
        onAssetSelect,
        tradingType: 'exchange',
    });

    const showAssetsScreenAndFocusInput = useCallback(() => {
        setShouldFocusInput(true);
        openAssetPicker();
    }, [openAssetPicker]);

    return (
        <HStack justifyContent="space-between" alignItems="center">
            <SelectTradeableAssetButton
                onPress={openAssetPicker}
                selectedAsset={selectedValue}
                buttonColorProps={{ intent: 'neutral', priority: 'secondary' }}
                caret
                testID={ASSET_PICKER_TEST_ID}
            />
            <ExchangeSendAmountInput ref={inputRef} onSelectAsset={showAssetsScreenAndFocusInput} />
        </HStack>
    );
};
