import { withSelectedAccountLoaded } from 'src/components/wallet';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketOffersContext } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { CoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { useCoinmarketSellForm } from 'src/hooks/wallet/coinmarket/form/useCoinmarketSellForm';
import { CoinmarketFooter } from 'src/views/wallet/coinmarket/common';
import CoinmarketOffers from 'src/views/wallet/coinmarket/common/CoinmarketOffers/CoinmarketOffers';
import { CoinmarketSelectedOffer } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketSelectedOffer';
import { withCoinmarketLayoutWrap } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/withCoinmarketLayoutWrap';

const CoinmarketSellOffersComponent = (props: UseCoinmarketProps) => {
    const coinmarketSellFormContextValues = useCoinmarketSellForm({
        ...props,
        pageType: 'offers',
    });
    const { selectedQuote } = coinmarketSellFormContextValues;

    // CoinmarketOffersContext.Provider is temporary FIX
    return (
        <CoinmarketFormContext.Provider value={coinmarketSellFormContextValues}>
            <CoinmarketOffersContext.Provider value={coinmarketSellFormContextValues}>
                {!selectedQuote ? <CoinmarketOffers /> : <CoinmarketSelectedOffer />}
                <CoinmarketFooter />
            </CoinmarketOffersContext.Provider>
        </CoinmarketFormContext.Provider>
    );
};
export const CoinmarketSellOffers = withSelectedAccountLoaded(
    withCoinmarketLayoutWrap(CoinmarketSellOffersComponent, {
        backRoute: 'wallet-coinmarket-sell',
    }),
    {
        title: 'TR_NAV_SELL',
    },
);
