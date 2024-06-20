import { CoinmarketFooter } from 'src/views/wallet/coinmarket/common';
import { useLayout } from 'src/hooks/suite';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import CoinmarketOffers from '../../../common/CoinmarketOffers/CoinmarketOffers';
import { CoinmarketTradeBuyType } from 'src/types/coinmarket/coinmarket';
import { useCoinmarketOffersContext } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { CoinmarketSelectedOffer } from '../../../common/CoinmarketSelectedOffer/CoinmarketSelectedOffer';

const Offers = () => {
    const { selectedQuote } = useCoinmarketOffersContext<CoinmarketTradeBuyType>();

    useLayout('Trezor Suite | Trade', () => <PageHeader backRoute="wallet-coinmarket-buy" />);

    return (
        <div>
            {!selectedQuote ? <CoinmarketOffers /> : <CoinmarketSelectedOffer />}
            <CoinmarketFooter />
        </div>
    );
};

export default Offers;
