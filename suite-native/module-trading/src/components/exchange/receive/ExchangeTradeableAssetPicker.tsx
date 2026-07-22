import { useDispatch } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { cryptoIdToSymbol } from '@suite-common/trading';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { HStack } from '@suite-native/atoms';
import { exchangeActions } from '@suite-native/trading-state';
import { type TradeableAsset } from '@suite-native/trading-types';

import { ExchangeReceiveAmountInput } from './ExchangeReceiveAmountInput';
import { ExchangeTradeableAssetsSheet } from './ExchangeTradeableAssetsSheet';
import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { useSheetControls } from '../../../hooks/general/useSheetControls';
import { SelectTradeableAssetButton } from '../../general/SelectTradeableAssetButton';

const ASSET_PICKER_TEST_ID = '@trading/exchange/asset-receive-button';

export const ExchangeTradeableAssetPicker = () => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const form = useExchangeFormContext();
    const { isSheetVisible, hideSheet, showSheet, setSelectedValue, selectedValue } =
        useSheetControls(form, 'receiveAsset');

    const handleAssetSelect = (asset: TradeableAsset) => {
        if (asset.cryptoId === selectedValue?.cryptoId) {
            return;
        }

        const previousSymbol = cryptoIdToSymbol(selectedValue?.cryptoId);
        const symbol = cryptoIdToSymbol(asset.cryptoId);

        setSelectedValue(asset);
        dispatch(
            previousSymbol === symbol
                ? exchangeActions.receiveTokenChanged()
                : exchangeActions.receiveAssetChanged(),
        );
        analytics.report({
            type: events.tradingParameterChangedEvent.name,
            payload: {
                type: 'exchange',
                parameter: 'cryptoTo',
            },
        });
    };

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
                <ExchangeReceiveAmountInput showAssetsSheet={showSheet} />
            </HStack>
            <ExchangeTradeableAssetsSheet
                onAssetSelect={handleAssetSelect}
                onClose={hideSheet}
                isVisible={isSheetVisible}
            />
        </>
    );
};
