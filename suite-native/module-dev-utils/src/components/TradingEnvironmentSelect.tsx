import React from 'react';
import { useSelector } from 'react-redux';

import { injectDispatch } from '@suite-common/redux-utils';
import { type TradeServerEnvironment, tradeApi } from '@suite-common/trading';
import { Select, type SelectItemType } from '@suite-native/atoms';
import { selectTradingEnvironment, tradingActions } from '@suite-native/trading-state';
import { useServices } from '@trezor/dependency-injection';

const tradingEnvironmentItems: SelectItemType<TradeServerEnvironment>[] = Object.keys(
    tradeApi.SERVERS,
).map(env => ({
    value: env as TradeServerEnvironment,
    label: env,
}));

export const TradingEnvironmentSelect = () => {
    const selectedTradingEnvironment = useSelector(selectTradingEnvironment);
    const { dispatch } = useServices(injectDispatch);

    const handleSelectEnvironment = (environment: TradeServerEnvironment) => {
        dispatch(tradingActions.setTradingEnvironment(environment));
    };

    return (
        <Select<TradeServerEnvironment>
            title="Environment"
            items={tradingEnvironmentItems}
            value={selectedTradingEnvironment}
            onSelectItem={handleSelectEnvironment}
            isLabelShown
        />
    );
};
