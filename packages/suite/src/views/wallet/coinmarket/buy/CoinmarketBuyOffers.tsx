import { useCoinmarketBuyForm } from 'src/hooks/wallet/coinmarket/form/useCoinmarketBuyForm';
import { CoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketFooter } from 'src/views/wallet/coinmarket/common';
import { CoinmarketContainer } from 'src/views/wallet/coinmarket/common/CoinmarketContainer';
import { CoinmarketOffers } from 'src/views/wallet/coinmarket/common/CoinmarketOffers/CoinmarketOffers';

const CoinmarketBuyOffersComponent = ({ selectedAccount }: UseCoinmarketProps) => {
    const coinmarketBuyFormContextValues = useCoinmarketBuyForm({
        selectedAccount,
        pageType: 'offers',
    });

    return (
        <CoinmarketFormContext.Provider value={coinmarketBuyFormContextValues}>
            <CoinmarketOffers />
            <CoinmarketFooter />
        </CoinmarketFormContext.Provider>
    );
};

export const CoinmarketBuyOffers = () => (
    <CoinmarketContainer
        title="TR_NAV_BUY"
        backRoute="wallet-coinmarket-buy"
        SectionComponent={CoinmarketBuyOffersComponent}
    />
);
