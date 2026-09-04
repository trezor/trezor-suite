import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { selectGetSupportedNetworksDep } from '@suite-common/networks';
import { HStack } from '@suite-native/atoms';
import { type FeatureFlagsRootState } from '@suite-native/feature-flags';
import { useWatch } from '@suite-native/forms';
import {
    type TradingRootState,
    exchangeActions,
    selectExchangeBuyTradeableAssets,
} from '@suite-native/trading-state';
import { type TradeableAsset } from '@suite-native/trading-types';

import { ExchangeReceiveAmountInput } from './ExchangeReceiveAmountInput';
import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { useTradeableAssetChange } from '../../../hooks/general/form/useTradeableAssetChange';
import { useTradeableAssetPickerNavigation } from '../../../hooks/general/useTradeableAssetPickerNavigation';
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
    const { getSupportedNetworks } = useServices(selectGetSupportedNetworksDep);
    const supportedNetworks = getSupportedNetworks();
    const assets = useSelector((state: TradingRootState & FeatureFlagsRootState) =>
        selectExchangeBuyTradeableAssets(state, supportedNetworks),
    );
    const selectedValue = useWatch({ control: form.control, name: 'receiveAsset' });
    const setSelectedValue = useCallback(
        (asset: TradeableAsset) => form.setValue('receiveAsset', asset),
        [form],
    );

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

    const showAssetsScreen = useTradeableAssetPickerNavigation({
        assets,
        onAssetSelect: handleAssetSelect,
        tradingType: 'exchange',
    });

    return (
        <HStack justifyContent="space-between" alignItems="center">
            <SelectTradeableAssetButton
                onPress={showAssetsScreen}
                selectedAsset={selectedValue}
                buttonColorProps={{ intent: 'neutral', priority: 'secondary' }}
                caret
                testID={ASSET_PICKER_TEST_ID}
            />
            <ExchangeReceiveAmountInput showAssetsSheet={showAssetsScreen} />
        </HStack>
    );
};
