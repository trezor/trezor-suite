import { useCallback, useRef, useState } from 'react';
import { type TextInput } from 'react-native';
import { useDispatch } from 'react-redux';

import { tradingExchangeActions } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
import { HStack } from '@suite-native/atoms';
import { type TradeableAsset } from '@suite-native/trading-types';

import { ExchangeSendAmountInput } from './ExchangeSendAmountInput';
import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { useSheetControls } from '../../../hooks/general/useSheetControls';
import { MyAssetSheet } from '../../general/MyAssetSheet/MyAssetSheet';
import { SelectTradeableAssetButton } from '../../general/SelectTradeableAssetButton';

const ASSET_PICKER_TEST_ID = '@trading/exchange/asset-send-button';

export const ExchangeSendAssetPicker = () => {
    const dispatch = useDispatch();
    const inputRef = useRef<TextInput>(null);
    const form = useExchangeFormContext();
    const [shouldFocusInput, setShouldFocusInput] = useState<boolean>(false);
    const { isSheetVisible, hideSheet, showSheet, setSelectedValue, selectedValue } =
        useSheetControls(form, 'sendAsset');

    const onAssetSelect = useCallback(
        (asset: TradeableAsset, account: Account) => {
            setSelectedValue(asset);
            dispatch(tradingExchangeActions.setTradingAccountKey(account.key));
            if (shouldFocusInput) {
                setShouldFocusInput(false);
                // CryptoAmountInput is rendered disabled allow changes to propagate.
                setTimeout(() => {
                    inputRef.current?.focus();
                }, 0);
            }
        },
        [shouldFocusInput, setSelectedValue, dispatch],
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
            />
        </>
    );
};
