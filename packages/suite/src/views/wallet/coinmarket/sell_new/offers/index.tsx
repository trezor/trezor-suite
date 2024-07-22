import { withSelectedAccountLoaded } from 'src/components/wallet';
import Offers from './Offers';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketOffersContext } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { CoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { useCoinmarketSellForm } from 'src/hooks/wallet/coinmarket/form/useCoinmarketSellForm';

const OffersIndex = (props: UseCoinmarketProps) => {
    const coinmarketSellFormContextValues = useCoinmarketSellForm({
        ...props,
        offFirstRequest: true,
    });

    // CoinmarketOffersContext.Provider is temporary FIX
    return (
        <CoinmarketFormContext.Provider value={coinmarketSellFormContextValues}>
            <CoinmarketOffersContext.Provider value={coinmarketSellFormContextValues}>
                <Offers />
            </CoinmarketOffersContext.Provider>
        </CoinmarketFormContext.Provider>
    );
};
export default withSelectedAccountLoaded(OffersIndex, {
    title: 'TR_NAV_SELL',
});
