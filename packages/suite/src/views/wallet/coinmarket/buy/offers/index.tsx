import { withSelectedAccountLoaded } from 'src/components/wallet';
import {
    CoinmarketBuyOffersContext,
    useCoinmarketBuyOffers,
} from 'src/hooks/wallet/coinmarket/offers/useCoinmarketBuyOffers';
import Offers from './Offers';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';

const OffersIndex = (props: UseCoinmarketProps) => {
    const coinmarketBuyOffers = useCoinmarketBuyOffers(props);

    return (
        <CoinmarketBuyOffersContext.Provider value={coinmarketBuyOffers}>
            <Offers />
        </CoinmarketBuyOffersContext.Provider>
    );
};

export default withSelectedAccountLoaded(OffersIndex, {
    title: 'TR_NAV_BUY',
});
