import { withSelectedAccountLoaded } from 'src/components/wallet';
import { useCoinmarketBuyForm } from 'src/hooks/wallet/coinmarket/form/useCoinmarketBuyForm';
import { CoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketOffersContext } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketFooter } from 'src/views/wallet/coinmarket/common';
import { withCoinmarketLayoutWrap } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/withCoinmarketLayoutWrap';
import { CoinmarketOffers } from 'src/views/wallet/coinmarket/common/CoinmarketOffers/CoinmarketOffers';

const CoinmarketBuyOffersComponent = (props: UseCoinmarketProps) => {
    const coinmarketBuyFormContextValues = useCoinmarketBuyForm({
        ...props,
        pageType: 'offers',
    });

    // CoinmarketOffersContext.Provider is temporary FIX
    return (
        <CoinmarketOffersContext.Provider value={coinmarketBuyFormContextValues}>
            <CoinmarketFormContext.Provider value={coinmarketBuyFormContextValues}>
                <CoinmarketOffers />
                <CoinmarketFooter />
            </CoinmarketFormContext.Provider>
        </CoinmarketOffersContext.Provider>
    );
};

export const CoinmarketBuyOffers = withSelectedAccountLoaded(
    withCoinmarketLayoutWrap(CoinmarketBuyOffersComponent, {
        backRoute: 'wallet-coinmarket-buy',
    }),
    {
        title: 'TR_NAV_BUY',
    },
);
