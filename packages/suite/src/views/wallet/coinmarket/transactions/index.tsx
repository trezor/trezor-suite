import { withSelectedAccountLoaded } from 'src/components/wallet';
import { CoinmarketAccountTransactions } from '../common/CoinmarketLayout/CoinmarketAccountTransactions/CoinmarketAccountTransactions';
import { useLayout } from 'src/hooks/suite';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';

const CoinmarketTransactions = () => {
    useLayout('Trezor Suite | Trade', () => <PageHeader backRoute="wallet-coinmarket-buy" />);

    return <CoinmarketAccountTransactions />;
};

export default withSelectedAccountLoaded(CoinmarketTransactions, {
    title: 'TR_NAV_SELL',
});
