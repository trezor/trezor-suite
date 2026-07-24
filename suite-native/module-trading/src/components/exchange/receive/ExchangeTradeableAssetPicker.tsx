import { HStack } from '@suite-native/atoms';
import { exchangeActions } from '@suite-native/trading-state';

import { ExchangeReceiveAmountInput } from './ExchangeReceiveAmountInput';
import { ExchangeTradeableAssetsSheet } from './ExchangeTradeableAssetsSheet';
import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { useTradeableAssetChange } from '../../../hooks/general/form/useTradeableAssetChange';
import { useSheetControls } from '../../../hooks/general/useSheetControls';
import { SelectTradeableAssetButton } from '../../general/SelectTradeableAssetButton';

const ASSET_PICKER_TEST_ID = '@trading/exchange/asset-receive-button';

// Selecting a receive asset that equals the send asset clears the send side. The receive change
// action dispatched afterwards already resets a superset of the send state, so no counterpart
// action is needed here.
const RECEIVE_ASSET_COLLISION = {
    counterpartAssetField: 'sendAsset',
    counterpartAmountField: 'sendCryptoAmount',
    counterpartAnalyticsParameter: 'cryptoFrom',
} as const;

export const ExchangeTradeableAssetPicker = () => {
    const form = useExchangeFormContext();
    const { isSheetVisible, hideSheet, showSheet, setSelectedValue, selectedValue } =
        useSheetControls(form, 'receiveAsset');

    const handleAssetSelect = useTradeableAssetChange({
        form,
        tradingType: 'exchange',
        selectedValue,
        setSelectedValue,
        analyticsParameter: 'cryptoTo',
        getAssetChangedAction: exchangeActions.receiveAssetChanged,
        getAssetTokenChangedAction: exchangeActions.receiveTokenChanged,
        collision: RECEIVE_ASSET_COLLISION,
    });

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
