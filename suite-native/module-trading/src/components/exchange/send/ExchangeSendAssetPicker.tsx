import { useCallback, useRef, useState } from 'react';
import { TextInput } from 'react-native';
import { useDispatch } from 'react-redux';

import { tradingExchangeActions } from '@suite-common/trading';
import { Account } from '@suite-common/wallet-types';
import { HStack } from '@suite-native/atoms';

import { ExchangeSendAmountInput } from './ExchangeSendAmountInput';
import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { useSheetControls } from '../../../hooks/general/useSheetControls';
import { TradeableAsset } from '../../../types/general';
import { MyAssetSheet } from '../../general/MyAssetSheet/MyAssetSheet';
import { SelectTradeableAssetButton } from '../../general/SelectTradeableAssetButton';

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
                    colorScheme="tertiaryElevation0"
                    caret
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
