import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { InvityServerEnvironment, invityAPI } from '@suite-common/trading';
import { Select, SelectItemType } from '@suite-native/atoms';
import { selectTradingEnvironment, tradingActions } from '@suite-native/module-trading';

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
            items={tradingEnvironmentItems}
            selectLabel="Environment"
            selectValue={selectedTradingEnvironment}
            onSelectItem={handleSelectEnvironment}
        />
    );
};
