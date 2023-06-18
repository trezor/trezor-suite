import React from 'react';
import {
    CoinmarketLayout,
    withSelectedAccountLoaded,
    WithSelectedAccountLoadedProps,
} from 'src/components/wallet';
import Spend from './components/Spend';
import { useCoinmarketSpend, SpendContext } from 'src/hooks/wallet/useCoinmarketSpend';

const CoinmarketSpend = (props: WithSelectedAccountLoadedProps) => {
    const coinmarketSpendContextValues = useCoinmarketSpend(props);

    return (
        <CoinmarketLayout selectedAccount={props.selectedAccount}>
            <SpendContext.Provider value={coinmarketSpendContextValues}>
                <Spend />
            </SpendContext.Provider>
        </CoinmarketLayout>
    );
};

export default withSelectedAccountLoaded(CoinmarketSpend, {
    title: 'TR_NAV_SPEND',
});
