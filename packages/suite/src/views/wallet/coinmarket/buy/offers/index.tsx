import { withSelectedAccountLoaded } from 'src/components/wallet';
import { useCoinmarketBuyOffers } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketBuyOffers';
import Offers from './Offers';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketOffersContext } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';

const OffersIndex = (props: UseCoinmarketProps) => {
    const coinmarketBuyOffers = useCoinmarketBuyOffers(props);

    return (
        <CoinmarketOffersContext.Provider value={coinmarketBuyOffers}>
            <Offers />
        </CoinmarketOffersContext.Provider>
    );
};

export default withSelectedAccountLoaded(OffersIndex, {
    title: 'TR_NAV_BUY',
});
