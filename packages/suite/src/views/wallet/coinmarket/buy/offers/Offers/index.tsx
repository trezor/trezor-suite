import { CoinmarketFooter } from 'src/views/wallet/coinmarket/common';
import { useLayout } from 'src/hooks/suite';
import { useCoinmarketBuyOffersContext } from 'src/hooks/wallet/useCoinmarketBuyOffers';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import SelectedOffer from './SelectedOffer';
import CoinmarketOffers from '../../../common/CoinmarketOffers/CoinmarketOffers';

const Offers = () => {
    const { selectedQuote } = useCoinmarketBuyOffersContext();

    useLayout('Trezor Suite | Trade', () => <PageHeader backRoute="wallet-coinmarket-buy" />);

    return (
        <div>
            {!selectedQuote ? <CoinmarketOffers /> : <SelectedOffer />}
            <CoinmarketFooter />
        </div>
    );
};

export default Offers;
