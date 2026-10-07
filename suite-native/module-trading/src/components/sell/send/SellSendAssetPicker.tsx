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

import { SellSendAccountCryptoBalance } from './SellSendAccountCryptoBalance';
import { SellSendAmountInput } from './SellSendAmountInput';
import { SellSendBaseCurrencyAmountInput } from './SellSendBaseCurrencyAmountInput';
import { useAssetSelectInputFocus } from '../../../hooks/general/useAssetSelectInputFocus';
import { useMyAssetPickerNavigation } from '../../../hooks/general/useMyAssetPickerNavigation';
import { useSellFormContext } from '../../../hooks/sell/useSellFormContext';
import { useSellSendAssetChange } from '../../../hooks/sell/useSellSendAssetChange';
import { TradeableAssetButton } from '../../general/TradeableAssetButton';

const ASSET_PICKER_TEST_ID = '@trading/sell/asset-send-button';

export const SellSendAssetPicker = () => {
    const cryptoInputRef = useRef<TextInput>(null);
    const baseCurrencyInputRef = useRef<TextInput>(null);
    const form = useSellFormContext();
    const { requestInputFocus, focusRequestedInput } = useAssetSelectInputFocus();
    const myAssets = useSelector((state: CombinedSelectorsRootState) =>
        selectAccountsWithTokensToSellSectionListByTradingType(state, 'sell'),
    );
    const { selectedAsset: selectedValue, changeAsset } = useSellSendAssetChange(form);

    const onAssetSelect = useCallback(
        (asset: TradeableAsset, account: Account) => {
            changeAsset(asset, account);
            focusRequestedInput();
        },
        [changeAsset, focusRequestedInput],
    );

    const showAssetsScreen = useMyAssetPickerNavigation({
        assets: myAssets,
        onAssetSelect,
        tradingType: 'sell',
    });

    const showAssetsScreenAndFocusInput = useCallback(
        (inputRef: RefObject<TextInput | null>) => {
            requestInputFocus(inputRef);
            showAssetsScreen();
        },
        [showAssetsScreen, requestInputFocus],
    );

    return (
        <>
            <HStack justifyContent="space-between" alignItems="center">
                <SellSendAmountInput
                    ref={cryptoInputRef}
                    showAssetsScreen={() => showAssetsScreenAndFocusInput(cryptoInputRef)}
                />
                <TradeableAssetButton
                    onPress={showAssetsScreen}
                    selectedAsset={selectedValue}
                    testID={ASSET_PICKER_TEST_ID}
                    caret
                />
            </HStack>
            <HStack justifyContent="space-between" alignItems="center" spacing="sp4">
                <SellSendBaseCurrencyAmountInput
                    ref={baseCurrencyInputRef}
                    showAssetsScreen={() => showAssetsScreenAndFocusInput(baseCurrencyInputRef)}
                />
                <SellSendAccountCryptoBalance />
            </HStack>
        </>
    );
};
