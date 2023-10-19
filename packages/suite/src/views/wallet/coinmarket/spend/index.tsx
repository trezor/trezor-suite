import { withSelectedAccountLoaded, WithSelectedAccountLoadedProps } from 'src/components/wallet';
import { useCoinmarketSpend, SpendContext } from 'src/hooks/wallet/useCoinmarketSpend';
import { CoinmarketLayout } from 'src/views/wallet/coinmarket/common';
import Spend from './components/Spend';

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
