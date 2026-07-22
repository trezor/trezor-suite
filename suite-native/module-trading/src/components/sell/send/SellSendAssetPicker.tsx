import { useCallback, useRef, useState } from 'react';
import { type TextInput } from 'react-native';
import { useDispatch } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { tradingSellActions } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { HStack } from '@suite-native/atoms';
import { sellActions } from '@suite-native/trading-state';
import { type TradeableAsset } from '@suite-native/trading-types';

import { SellSendAmountInput } from './SellSendAmountInput';
import { useSheetControls } from '../../../hooks/general/useSheetControls';
import { useSellFormContext } from '../../../hooks/sell/useSellFormContext';
import { MyAssetSheet } from '../../general/MyAssetSheet/MyAssetSheet';
import { SelectTradeableAssetButton } from '../../general/SelectTradeableAssetButton';

const ASSET_PICKER_TEST_ID = '@trading/sell/asset-send-button';
const ASSET_SHEET_TEST_ID = '@trading/sell/send-asset-sheet';

export const SellSendAssetPicker = () => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const inputRef = useRef<TextInput>(null);
    const form = useSellFormContext();
    const [shouldFocusInput, setShouldFocusInput] = useState<boolean>(false);
    const { isSheetVisible, hideSheet, showSheet, setSelectedValue, selectedValue } =
        useSheetControls(form, 'sendAsset');

    const onAssetSelect = useCallback(
        (asset: TradeableAsset, account: Account) => {
            dispatch(tradingSellActions.setTradingAccountKey(account.key));

            if (asset.cryptoId !== selectedValue?.cryptoId) {
                setSelectedValue(asset);
                form.setValue('cryptoStringAmount', undefined, { shouldValidate: true });
                dispatch(sellActions.sendAssetChanged());
                analytics.report({
                    type: events.tradingParameterChangedEvent.name,
                    payload: {
                        type: 'sell',
                        parameter: 'cryptoFrom',
                    },
                });
            }

            if (shouldFocusInput) {
                setShouldFocusInput(false);
                // CryptoAmountInput is rendered disabled allow changes to propagate.
                setTimeout(() => {
                    inputRef.current?.focus();
                }, 0);
            }
        },
        [analytics, dispatch, form, selectedValue?.cryptoId, setSelectedValue, shouldFocusInput],
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
                    buttonColorProps={{ intent: 'brand', priority: 'primary' }}
                    testID={ASSET_PICKER_TEST_ID}
                    caret
                />
                <SellSendAmountInput ref={inputRef} showAssetsSheet={showAssetsSheet} />
            </HStack>
            <MyAssetSheet
                tradingType="sell"
                isVisible={isSheetVisible}
                onClose={hideSheet}
                onAssetSelect={onAssetSelect}
                testID={ASSET_SHEET_TEST_ID}
            />
        </>
    );
};
