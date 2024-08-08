import { withSelectedAccountLoaded } from 'src/components/wallet';
import Offers from './Offers';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketOffersContext } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import useCoinmarketBuyForm from 'src/hooks/wallet/coinmarket/form/useCoinmarketBuyForm';
import { CoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { withCoinmarketLayoutWrap } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/withCoinmarketLayoutWrap';

const OffersIndex = (props: UseCoinmarketProps) => {
    const coinmarketBuyFormContextValues = useCoinmarketBuyForm({
        ...props,
        pageType: 'offers',
    });

    // CoinmarketOffersContext.Provider is temporary FIX
    return (
        <CoinmarketFormContext.Provider value={coinmarketBuyFormContextValues}>
            <CoinmarketOffersContext.Provider value={coinmarketBuyFormContextValues}>
                <Offers />
            </CoinmarketOffersContext.Provider>
        </CoinmarketFormContext.Provider>
    );
};

export default withSelectedAccountLoaded(
    withCoinmarketLayoutWrap(OffersIndex, {
        backRoute: 'wallet-coinmarket-buy',
    }),
    {
        title: 'TR_NAV_BUY',
    },
);
