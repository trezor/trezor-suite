import { useCallback, useRef, useState } from 'react';
import { TextInput } from 'react-native';

import { HStack } from '@suite-native/atoms';

import { ExchangeSendAmountInput } from './ExchangeSendAmountInput';
import { useExchangeFormContext } from '../../hooks/exchange/useExchangeFormContext';
import { useSheetControls } from '../../hooks/general/useSheetControls';
import { SelectTradeableAssetButton } from '../general/SelectTradeableAssetButton';

export const ExchangeSendAssetPicker = () => {
    const inputRef = useRef<TextInput>(null);
    const form = useExchangeFormContext();
    const [_shouldFocusInput, setShouldFocusInput] = useState<boolean>(false);
    const { showSheet, selectedValue } = useSheetControls(form, 'sendAsset');

    // TODO use in sheet
    // const onAssetSelect = useCallback(
    //     (asset: Asset) => {
    //         setSelectedValue(asset);
    //         if (shouldFocusInput) {
    //             setShouldFocusInput(false);
    //             // CryptoAmountInput is rendered disabled allow changes to propagate.
    //             setTimeout(() => {
    //                 inputRef.current?.focus();
    //             }, 0);
    //         }
    //     },
    //     [shouldFocusInput, setSelectedValue],
    // );

    const showAssetsSheet = useCallback(() => {
        setShouldFocusInput(true);
        showSheet();
    }, [showSheet]);

    // TODO account picker sheet
    return (
        <HStack justifyContent="space-between" alignItems="center">
            <SelectTradeableAssetButton
                onPress={showSheet}
                selectedAsset={selectedValue}
                colorScheme="tertiaryElevation0"
                caret
            />
            <ExchangeSendAmountInput ref={inputRef} showAssetsSheet={showAssetsSheet} />
        </HStack>
    );
};
