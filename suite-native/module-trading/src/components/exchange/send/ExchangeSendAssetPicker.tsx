import { useCallback, useRef, useState } from 'react';
import { type TextInput } from 'react-native';

import { tradingExchangeActions } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
import { HStack } from '@suite-native/atoms';
import { exchangeActions } from '@suite-native/trading-state';
import { type TradeableAsset } from '@suite-native/trading-types';

import { ExchangeSendAmountInput } from './ExchangeSendAmountInput';
import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { useTradeableAssetChange } from '../../../hooks/general/form/useTradeableAssetChange';
import { useSheetControls } from '../../../hooks/general/useSheetControls';
import { MyAssetSheet } from '../../general/MyAssetSheet/MyAssetSheet';
import { SelectTradeableAssetButton } from '../../general/SelectTradeableAssetButton';

const ASSET_PICKER_TEST_ID = '@trading/exchange/asset-send-button';
const ASSET_SHEET_TEST_ID = '@trading/exchange/send-asset-sheet';

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
    const { isSheetVisible, hideSheet, showSheet, setSelectedValue, selectedValue } =
        useSheetControls(form, 'sendAsset');

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

    const showAssetsSheet = useCallback(() => {
        setShouldFocusInput(true);
        showSheet();
    }, [showSheet]);

    return (
        <>
            <HStack justifyContent="space-between" alignItems="center">
                <SelectTradeableAssetButton
                    onPress={showSheet}
                    selectedAsset={selectedValue}
                    buttonColorProps={{ intent: 'neutral', priority: 'secondary' }}
                    caret
                    testID={ASSET_PICKER_TEST_ID}
                />
                <ExchangeSendAmountInput ref={inputRef} showAssetsSheet={showAssetsSheet} />
            </HStack>
            <MyAssetSheet
                tradingType="exchange"
                isVisible={isSheetVisible}
                onClose={hideSheet}
                onAssetSelect={onAssetSelect}
                testID={ASSET_SHEET_TEST_ID}
            />
        </>
    );
};
