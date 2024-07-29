import { withSelectedAccountLoaded } from 'src/components/wallet';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketOffersContext } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { CoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { useCoinmarketSellForm } from 'src/hooks/wallet/coinmarket/form/useCoinmarketSellForm';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { useLayout } from 'src/hooks/suite';
import { CoinmarketFooter } from 'src/views/wallet/coinmarket/common';
import CoinmarketOffers from 'src/views/wallet/coinmarket/common/CoinmarketOffers/CoinmarketOffers';
import { CoinmarketSelectedOffer } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketSelectedOffer';

const CoinmarketSellOffersComponent = (props: UseCoinmarketProps) => {
    const coinmarketSellFormContextValues = useCoinmarketSellForm({
        ...props,
        pageType: 'offers',
    });
    const { selectedQuote } = coinmarketSellFormContextValues;

    useLayout('Trezor Suite | Trade', () => <PageHeader backRoute="wallet-coinmarket-sell" />);

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
export const CoinmarketSellOffers = withSelectedAccountLoaded(CoinmarketSellOffersComponent, {
    title: 'TR_NAV_SELL',
});
