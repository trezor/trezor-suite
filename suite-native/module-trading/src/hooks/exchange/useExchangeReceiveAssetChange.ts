import { useCallback } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { useWatch } from '@suite-native/forms';
import { exchangeActions } from '@suite-native/trading-state';
import { type ExchangeFormType, type TradeableAsset } from '@suite-native/trading-types';

import { useTradeableAssetChange } from '../general/form/useTradeableAssetChange';

const RECEIVE_ASSET_COLLISION = {
    counterpartAssetField: 'sendAsset',
    counterpartAmountField: 'sendCryptoAmount',
    counterpartAnalyticsParameter: 'cryptoFrom',
} as const;

export const useExchangeReceiveAssetChange = (form: ExchangeFormType) => {
    const { dispatch } = useServices(injectDispatch);
    const selectedAsset = useWatch({ control: form.control, name: 'receiveAsset' });
    const setSelectedAsset = useCallback(
        (asset: TradeableAsset) => form.setValue('receiveAsset', asset),
        [form],
    );

    const changeAsset = useTradeableAssetChange({
        form,
        tradingType: 'exchange',
        selectedValue: selectedAsset,
        setSelectedValue: setSelectedAsset,
        analyticsParameter: 'cryptoTo',
        getAssetChangedAction: exchangeActions.receiveAssetChanged,
        getAssetTokenChangedAction: exchangeActions.receiveTokenChanged,
        collision: RECEIVE_ASSET_COLLISION,
    });

    const clearAsset = useCallback(() => {
        form.setValue('receiveAsset', undefined);
        dispatch(exchangeActions.receiveAssetChanged());
    }, [dispatch, form]);

    return { selectedAsset, changeAsset, clearAsset };
};
