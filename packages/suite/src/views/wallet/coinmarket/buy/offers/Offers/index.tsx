import { CoinmarketFooter } from 'src/views/wallet/coinmarket/common';
import { useLayout } from 'src/hooks/suite';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { CoinmarketTradeBuyType } from 'src/types/coinmarket/coinmarket';
import { useCoinmarketOffersContext } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import CoinmarketOffers from 'src/views/wallet/coinmarket/common/CoinmarketOffers/CoinmarketOffers';
import { CoinmarketSelectedOffer } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketSelectedOffer';

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
