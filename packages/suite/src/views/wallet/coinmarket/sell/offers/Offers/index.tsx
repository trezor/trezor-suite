import { CoinmarketFooter } from 'src/views/wallet/coinmarket/common';
import { SelectedOffer } from './SelectedOffer';
import CoinmarketOffers from '../../../common/CoinmarketOffers/CoinmarketOffers';
import { useCoinmarketOffersContext } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { CoinmarketTradeSellType } from 'src/types/coinmarket/coinmarket';

const Offers = () => {
    const { selectedQuote } = useCoinmarketOffersContext<CoinmarketTradeSellType>();

    return (
        <div>
            {!selectedQuote ? <CoinmarketOffers /> : <SelectedOffer />}
            <CoinmarketFooter />
        </div>
    );
};

export default Offers;
