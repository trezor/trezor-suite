import { useCoinmarketBuyForm } from 'src/hooks/wallet/coinmarket/form/useCoinmarketBuyForm';
import { CoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketOffersContext } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketFooter } from 'src/views/wallet/coinmarket/common';
import { CoinmarketContainer } from 'src/views/wallet/coinmarket/common/CoinmarketContainer';
import { CoinmarketOffers } from 'src/views/wallet/coinmarket/common/CoinmarketOffers/CoinmarketOffers';

const CoinmarketBuyOffersComponent = ({ selectedAccount }: UseCoinmarketProps) => {
    const coinmarketBuyFormContextValues = useCoinmarketBuyForm({
        selectedAccount,
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

export const CoinmarketBuyOffers = () => (
    <CoinmarketContainer
        title="TR_NAV_BUY"
        backRoute="wallet-coinmarket-buy"
        SectionComponent={CoinmarketBuyOffersComponent}
    />
);
