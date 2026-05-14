import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { type InvityServerEnvironment, invityAPI } from '@suite-common/trading';
import { Select, type SelectItemType } from '@suite-native/atoms';
import { selectTradingEnvironment, tradingActions } from '@suite-native/trading-state';

const tradingEnvironmentItems: SelectItemType<InvityServerEnvironment>[] = Object.keys(
    invityAPI.SERVERS,
).map(env => ({
    value: env as InvityServerEnvironment,
    label: env,
}));

export const TradingEnvironmentSelect = () => {
    const selectedTradingEnvironment = useSelector(selectTradingEnvironment);
    const dispatch = useDispatch();

    const handleSelectEnvironment = (environment: InvityServerEnvironment) => {
        dispatch(tradingActions.setTradingEnvironment(environment));
    };

    return (
        <Select<InvityServerEnvironment>
            title="Environment"
            items={tradingEnvironmentItems}
            value={selectedTradingEnvironment}
            onSelectItem={handleSelectEnvironment}
            isLabelShown
        />
    );
};
