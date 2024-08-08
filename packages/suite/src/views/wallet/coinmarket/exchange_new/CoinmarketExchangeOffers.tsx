import { withSelectedAccountLoaded } from 'src/components/wallet';
import { useCoinmarketExchangeOffers } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketExchangeOffers';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketOffersContext } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import CoinmarketOffers from 'src/views/wallet/coinmarket/common/CoinmarketOffers/CoinmarketOffers';
import SelectedOffer from 'src/views/wallet/coinmarket/exchange_new/offers/Offers/SelectedOffer';
import { CoinmarketFooter } from 'src/views/wallet/coinmarket/common';
import { CoinmarketExchangeFormContextProps } from 'src/types/coinmarket/coinmarketForm';
import { withCoinmarketLayoutWrap } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/withCoinmarketLayoutWrap';

const CoinmarketExchangeOffersComponent = (props: UseCoinmarketProps) => {
    const coinmarketExchangeOffers = useCoinmarketExchangeOffers(
        props,
    ) as unknown as CoinmarketExchangeFormContextProps; // FIXME: exchange;
    const { selectedQuote } = coinmarketExchangeOffers;

    return (
        <CoinmarketOffersContext.Provider value={coinmarketExchangeOffers}>
            {!selectedQuote ? <CoinmarketOffers /> : <SelectedOffer />}
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
