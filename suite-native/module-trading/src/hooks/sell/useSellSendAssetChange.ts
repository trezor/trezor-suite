import { useCallback } from 'react';

import { tradingSellActions } from '@suite-common/trading';
import { useWatch } from '@suite-native/forms';
import { sellActions } from '@suite-native/trading-state';
import { type SellFormType, type TradeableAsset } from '@suite-native/trading-types';

import { useTradeableAssetChange } from '../general/form/useTradeableAssetChange';

export const useSellSendAssetChange = (form: SellFormType) => {
    const { control, setValue } = form;
    const selectedAsset = useWatch({ control, name: 'sendAsset' });
    const setSelectedAsset = useCallback(
        (asset: TradeableAsset) => setValue('sendAsset', asset),
        [setValue],
    );

    const changeAsset = useTradeableAssetChange({
        form,
        tradingType: 'sell',
        selectedValue: selectedAsset,
        setSelectedValue: setSelectedAsset,
        analyticsParameter: 'cryptoFrom',
        getAssetChangedAction: sellActions.sendAssetChanged,
        getSetTradingAccountKeyAction: tradingSellActions.setTradingAccountKey,
    });

    return { selectedAsset, changeAsset };
};
