import { CoinmarketFooter } from 'src/views/wallet/coinmarket/common';
import { useLayout } from 'src/hooks/suite/useLayout';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { SelectedOffer } from './SelectedOffer';
import CoinmarketOffers from '../../../common/CoinmarketOffers/CoinmarketOffers';
import { useCoinmarketOffersContext } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { CoinmarketTradeSellType } from 'src/types/coinmarket/coinmarket';

const Offers = () => {
    const { selectedQuote } = useCoinmarketOffersContext<CoinmarketTradeSellType>();

    useLayout('Trezor Suite | Trade', () => <PageHeader backRoute="wallet-coinmarket-sell" />);

    return (
        <div>
            {!selectedQuote ? <CoinmarketOffers /> : <SelectedOffer />}
            <CoinmarketFooter />
        </div>
    );
};

export default Offers;
