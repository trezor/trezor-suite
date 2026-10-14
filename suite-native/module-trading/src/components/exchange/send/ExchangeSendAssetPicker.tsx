import { type RefObject, useCallback, useRef } from 'react';
import { type TextInput } from 'react-native';
import { useSelector } from 'react-redux';

import { type Account } from '@suite-common/wallet-types';
import { HStack } from '@suite-native/atoms';
import {
    type CombinedSelectorsRootState,
    selectAccountsWithTokensToSellSectionListByTradingType,
} from '@suite-native/trading-state';
import { type TradeableAsset } from '@suite-native/trading-types';

import { ExchangeSendAccountCryptoBalance } from './ExchangeSendAccountCryptoBalance';
import { ExchangeSendAmountInput } from './ExchangeSendAmountInput';
import { ExchangeSendBaseCurrencyAmountInput } from './ExchangeSendBaseCurrencyAmountInput';
import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { useExchangeSendAssetChange } from '../../../hooks/exchange/useExchangeSendAssetChange';
import { useAssetSelectInputFocus } from '../../../hooks/general/useAssetSelectInputFocus';
import { useMyAssetPickerNavigation } from '../../../hooks/general/useMyAssetPickerNavigation';
import { TradeableAssetButton } from '../../general/TradeableAssetButton';

const ASSET_PICKER_TEST_ID = '@trading/exchange/asset-send-button';

export const ExchangeSendAssetPicker = () => {
    const cryptoInputRef = useRef<TextInput>(null);
    const baseCurrencyInputRef = useRef<TextInput>(null);
    const form = useExchangeFormContext();
    const { requestInputFocus, focusRequestedInput } = useAssetSelectInputFocus();
    const myAssets = useSelector((state: CombinedSelectorsRootState) =>
        selectAccountsWithTokensToSellSectionListByTradingType(state, 'exchange'),
    );
    const { selectedAsset: selectedValue, changeAsset } = useExchangeSendAssetChange(form);

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
