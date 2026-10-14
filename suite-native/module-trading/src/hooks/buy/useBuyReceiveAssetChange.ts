import { useCallback } from 'react';

import { useWatch } from '@suite-native/forms';
import { buyActions } from '@suite-native/trading-state';
import { type BuyFormType, type TradeableAsset } from '@suite-native/trading-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useTradeableAssetChange } from '../general/form/useTradeableAssetChange';

export const useBuyReceiveAssetChange = (form: BuyFormType) => {
    const { dispatch } = useServices(injectDispatch);
    const selectedAsset = useWatch({ control: form.control, name: 'asset' });
    const setSelectedAsset = useCallback(
        (asset: TradeableAsset) => form.setValue('asset', asset),
        [form],
    );

    const changeAsset = useTradeableAssetChange({
        form,
        tradingType: 'buy',
        selectedValue: selectedAsset,
        setSelectedValue: setSelectedAsset,
        analyticsParameter: 'cryptoTo',
        getAssetChangedAction: buyActions.assetChanged,
        getAssetTokenChangedAction: buyActions.assetTokenChanged,
    });

    const clearAsset = useCallback(() => {
        form.setValue('asset', undefined);
        dispatch(buyActions.assetChanged());
    }, [dispatch, form]);

    return { selectedAsset, changeAsset, clearAsset };
};
