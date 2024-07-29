import { withSelectedAccountLoaded } from 'src/components/wallet';
import { useCoinmarketExchangeOffers } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketExchangeOffers';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketOffersContext } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { useLayout } from 'src/hooks/suite';
import CoinmarketOffers from 'src/views/wallet/coinmarket/common/CoinmarketOffers/CoinmarketOffers';
import SelectedOffer from 'src/views/wallet/coinmarket/exchange_new/offers/Offers/SelectedOffer';
import { CoinmarketFooter } from 'src/views/wallet/coinmarket/common';
import { CoinmarketExchangeFormContextProps } from 'src/types/coinmarket/coinmarketForm';

const CoinmarketExchangeOffersComponent = (props: UseCoinmarketProps) => {
    const coinmarketExchangeOffers = useCoinmarketExchangeOffers(
        props,
    ) as unknown as CoinmarketExchangeFormContextProps; // FIXME: exchange;
    const { selectedQuote } = coinmarketExchangeOffers;

    useLayout('Trezor Suite | Trade', () => <PageHeader backRoute="wallet-coinmarket-exchange" />);

    return (
        <CoinmarketOffersContext.Provider value={coinmarketExchangeOffers}>
            {!selectedQuote ? <CoinmarketOffers /> : <SelectedOffer />}
            <CoinmarketFooter />
        </CoinmarketOffersContext.Provider>
    );
};

export const CoinmarketExchangeOffers = withSelectedAccountLoaded(
    CoinmarketExchangeOffersComponent,
    {
        title: 'TR_NAV_EXCHANGE',
    },
);
