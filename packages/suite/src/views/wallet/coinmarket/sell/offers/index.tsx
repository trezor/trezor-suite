import { withSelectedAccountLoaded } from 'src/components/wallet';
import Offers from './Offers';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { useCoinmarketSellOffers } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketSellOffers';
import { CoinmarketOffersContext } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';

const OffersIndex = (props: UseCoinmarketProps) => {
    const coinmarketSellOffers = useCoinmarketSellOffers(props);

    return (
        <CoinmarketOffersContext.Provider value={coinmarketSellOffers as any}>
            <Offers />
        </CoinmarketOffersContext.Provider>
    );
};

export default withSelectedAccountLoaded(OffersIndex, {
    title: 'TR_NAV_SELL',
});
