import { withSelectedAccountLoaded, WithSelectedAccountLoadedProps } from 'src/components/wallet';
import { CoinmarketBuyOffersContext, useOffers } from 'src/hooks/wallet/useCoinmarketBuyOffers';
import Offers from './Offers';

const OffersIndex = (props: WithSelectedAccountLoadedProps) => {
    const coinmarketOffersValues = useOffers(props);

    return (
        <CoinmarketBuyOffersContext.Provider value={coinmarketOffersValues}>
            <Offers />
        </CoinmarketBuyOffersContext.Provider>
    );
};

export default withSelectedAccountLoaded(OffersIndex, {
    title: 'TR_NAV_BUY',
});
