import React from 'react';
import {
    CoinmarketLayout,
    withSelectedAccountLoaded,
    WithSelectedAccountLoadedProps,
} from '@wallet-components';
import Spend from './components/Spend';
import { useCoinmarketSpend, SpendContext } from '@wallet-hooks/useCoinmarketSpend';

const CoinmarketSpend = (props: WithSelectedAccountLoadedProps) => {
    const coinmarketSpendContextValues = useCoinmarketSpend(props);

    return (
        <CoinmarketLayout>
            <SpendContext.Provider value={coinmarketSpendContextValues}>
                <Spend />
            </SpendContext.Provider>
        </CoinmarketLayout>
    );
};

export default withSelectedAccountLoaded(CoinmarketSpend, {
    title: 'TR_NAV_SPEND',
});
