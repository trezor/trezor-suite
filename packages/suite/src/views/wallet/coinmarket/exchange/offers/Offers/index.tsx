import { CoinmarketFooter } from 'src/views/wallet/coinmarket/common';
import SelectedOffer from './SelectedOffer';
import { useCoinmarketOffersContext } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { CoinmarketTradeExchangeType } from 'src/types/coinmarket/coinmarket';
import CoinmarketOffers from '../../../common/CoinmarketOffers/CoinmarketOffers';

const Offers = () => {
    const { selectedQuote } = useCoinmarketOffersContext<CoinmarketTradeExchangeType>();

    return (
        <div>
            {!selectedQuote ? <CoinmarketOffers /> : <SelectedOffer />}
            <CoinmarketFooter />
        </div>
    );
};

export default Offers;
