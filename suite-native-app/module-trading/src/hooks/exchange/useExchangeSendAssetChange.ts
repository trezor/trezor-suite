import { useCallback } from 'react';

import { tradingExchangeActions } from '@suite-common/trading';
import { useWatch } from '@suite-native/forms';
import { exchangeActions } from '@suite-native/trading-state';
import { type ExchangeFormType, type TradeableAsset } from '@suite-native/trading-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useTradeableAssetChange } from '../general/form/useTradeableAssetChange';

const SEND_ASSET_COLLISION = {
    counterpartAssetField: 'receiveAsset',
    counterpartAnalyticsParameter: 'cryptoTo',
    getCounterpartChangedAction: exchangeActions.receiveAssetChanged,
} as const;

export const useExchangeSendAssetChange = (form: ExchangeFormType) => {
    const { dispatch } = useServices(injectDispatch);
    const selectedAsset = useWatch({ control: form.control, name: 'sendAsset' });
    const setSelectedAsset = useCallback(
        (asset: TradeableAsset) => form.setValue('sendAsset', asset),
        [form],
    );

    const changeAsset = useTradeableAssetChange({
        form,
        tradingType: 'exchange',
        selectedValue: selectedAsset,
        setSelectedValue: setSelectedAsset,
        analyticsParameter: 'cryptoFrom',
        getAssetChangedAction: exchangeActions.sendAssetChanged,
        getSetTradingAccountKeyAction: tradingExchangeActions.setTradingAccountKey,
        collision: SEND_ASSET_COLLISION,
    });

    const clearAsset = useCallback(() => {
        form.setValue('sendAsset', undefined);
        dispatch(tradingExchangeActions.setTradingAccountKey(undefined));
    }, [dispatch, form]);

    return { selectedAsset, changeAsset, clearAsset };
};
