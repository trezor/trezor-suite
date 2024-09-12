import { withSelectedAccountLoaded } from 'src/components/wallet';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketOffersContext } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import CoinmarketOffers from 'src/views/wallet/coinmarket/common/CoinmarketOffers/CoinmarketOffers';
import { CoinmarketFooter } from 'src/views/wallet/coinmarket/common';
import { withCoinmarketLayoutWrap } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/withCoinmarketLayoutWrap';
import { useCoinmarketExchangeForm } from 'src/hooks/wallet/coinmarket/form/useCoinmarketExchangeForm';

const CoinmarketExchangeOffersComponent = (props: UseCoinmarketProps) => {
    const coinmarketExchangeContextValues = useCoinmarketExchangeForm({
        ...props,
        pageType: 'offers',
    });

    return (
        <CoinmarketOffersContext.Provider value={coinmarketExchangeContextValues}>
            <CoinmarketOffers />
            <CoinmarketFooter />
        </CoinmarketOffersContext.Provider>
    );
};

export const CoinmarketExchangeOffers = withSelectedAccountLoaded(
    withCoinmarketLayoutWrap(CoinmarketExchangeOffersComponent, {
        backRoute: 'wallet-coinmarket-exchange',
    }),
    {
        title: 'TR_NAV_EXCHANGE',
    },
);
