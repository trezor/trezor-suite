import { useCallback, useRef, useState } from 'react';
import { type TextInput } from 'react-native';
import { useDispatch } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { tradingExchangeActions } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { HStack } from '@suite-native/atoms';
import { exchangeActions } from '@suite-native/trading-state';
import { type TradeableAsset } from '@suite-native/trading-types';

import { ExchangeSendAmountInput } from './ExchangeSendAmountInput';
import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { useSheetControls } from '../../../hooks/general/useSheetControls';
import { MyAssetSheet } from '../../general/MyAssetSheet/MyAssetSheet';
import { SelectTradeableAssetButton } from '../../general/SelectTradeableAssetButton';

const ASSET_PICKER_TEST_ID = '@trading/exchange/asset-send-button';
const ASSET_SHEET_TEST_ID = '@trading/exchange/send-asset-sheet';

export const ExchangeSendAssetPicker = () => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const inputRef = useRef<TextInput>(null);
    const form = useExchangeFormContext();
    const [shouldFocusInput, setShouldFocusInput] = useState<boolean>(false);
    const { isSheetVisible, hideSheet, showSheet, setSelectedValue, selectedValue } =
        useSheetControls(form, 'sendAsset');

    const onAssetSelect = useCallback(
        (asset: TradeableAsset, account: Account) => {
            dispatch(tradingExchangeActions.setTradingAccountKey(account.key));

            if (asset.cryptoId !== selectedValue?.cryptoId) {
                setSelectedValue(asset);
                form.setValue('sendCryptoAmount', undefined, { shouldValidate: true });

                if (asset.cryptoId === form.getValues('receiveAsset')?.cryptoId) {
                    form.setValue('receiveAsset', undefined);
                    dispatch(exchangeActions.receiveAssetChanged());
                    analytics.report({
                        type: events.tradingParameterChangedEvent.name,
                        payload: {
                            type: 'exchange',
                            parameter: 'cryptoTo',
                        },
                    });
                }

                dispatch(exchangeActions.sendAssetChanged());
                analytics.report({
                    type: events.tradingParameterChangedEvent.name,
                    payload: {
                        type: 'exchange',
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
