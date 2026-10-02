import { type RefObject, useCallback, useRef } from 'react';
import { type TextInput } from 'react-native';
import { useSelector } from 'react-redux';

import { tradingExchangeActions } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
import { HStack } from '@suite-native/atoms';
import { useWatch } from '@suite-native/forms';
import {
    type CombinedSelectorsRootState,
    exchangeActions,
    selectAccountsWithTokensToSellSectionListByTradingType,
} from '@suite-native/trading-state';
import { type TradeableAsset } from '@suite-native/trading-types';

import { ExchangeSendAccountCryptoBalance } from './ExchangeSendAccountCryptoBalance';
import { ExchangeSendAmountInput } from './ExchangeSendAmountInput';
import { ExchangeSendBaseCurrencyAmountInput } from './ExchangeSendBaseCurrencyAmountInput';
import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { useTradeableAssetChange } from '../../../hooks/general/form/useTradeableAssetChange';
import { useAssetSelectInputFocus } from '../../../hooks/general/useAssetSelectInputFocus';
import { useMyAssetPickerNavigation } from '../../../hooks/general/useMyAssetPickerNavigation';
import { TradeableAssetButton } from '../../general/TradeableAssetButton';

const ASSET_PICKER_TEST_ID = '@trading/exchange/asset-send-button';

// Selecting a send asset that equals the receive asset clears the receive side. `sendAssetChanged`
// alone would leave the stale receive account behind, so the collision resets the receive asset too.
const SEND_ASSET_COLLISION = {
    counterpartAssetField: 'receiveAsset',
    counterpartAnalyticsParameter: 'cryptoTo',
    getCounterpartChangedAction: exchangeActions.receiveAssetChanged,
} as const;

export const ExchangeSendAssetPicker = () => {
    const cryptoInputRef = useRef<TextInput>(null);
    const baseCurrencyInputRef = useRef<TextInput>(null);
    const form = useExchangeFormContext();
    const { requestInputFocus, focusRequestedInput } = useAssetSelectInputFocus();
    const myAssets = useSelector((state: CombinedSelectorsRootState) =>
        selectAccountsWithTokensToSellSectionListByTradingType(state, 'exchange'),
    );
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
        getAssetChangedAction: exchangeActions.sendAssetChanged,
        getSetTradingAccountKeyAction: tradingExchangeActions.setTradingAccountKey,
        collision: SEND_ASSET_COLLISION,
    });

    const onAssetSelect = useCallback(
        (asset: TradeableAsset, account: Account) => {
            changeAsset(asset, account);
            focusRequestedInput();
        },
        [changeAsset, focusRequestedInput],
    );

    const openAssetPicker = useMyAssetPickerNavigation({
        assets: myAssets,
        onAssetSelect,
        tradingType: 'exchange',
    });

    const openAssetPickerAndFocusInput = useCallback(
        (inputRef: RefObject<TextInput | null>) => {
            requestInputFocus(inputRef);
            openAssetPicker();
        },
        [openAssetPicker, requestInputFocus],
    );

    return (
        <>
            <HStack justifyContent="space-between" alignItems="center">
                <ExchangeSendAmountInput
                    ref={cryptoInputRef}
                    onSelectAsset={() => openAssetPickerAndFocusInput(cryptoInputRef)}
                />
                <TradeableAssetButton
                    onPress={openAssetPicker}
                    selectedAsset={selectedValue}
                    caret
                    testID={ASSET_PICKER_TEST_ID}
                />
            </HStack>
            <HStack justifyContent="space-between" alignItems="center" spacing="sp4">
                <ExchangeSendBaseCurrencyAmountInput
                    ref={baseCurrencyInputRef}
                    onSelectAsset={() => openAssetPickerAndFocusInput(baseCurrencyInputRef)}
                />
                <ExchangeSendAccountCryptoBalance />
            </HStack>
        </>
    );
};
