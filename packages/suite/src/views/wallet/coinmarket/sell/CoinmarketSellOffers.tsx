import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { useCoinmarketSellForm } from 'src/hooks/wallet/coinmarket/form/useCoinmarketSellForm';
import { CoinmarketOffers } from 'src/views/wallet/coinmarket/common/CoinmarketOffers/CoinmarketOffers';
import { CoinmarketContainer } from 'src/views/wallet/coinmarket/common/CoinmarketContainer';

const CoinmarketSellOffersComponent = ({ selectedAccount }: UseCoinmarketProps) => {
    const coinmarketSellFormContextValues = useCoinmarketSellForm({
        selectedAccount,
        pageType: 'offers',
    });

    return (
        <CoinmarketFormContext.Provider value={coinmarketSellFormContextValues}>
            <CoinmarketOffers />
        </CoinmarketFormContext.Provider>
    );
};
export const CoinmarketSellOffers = () => (
    <CoinmarketContainer
        title="TR_NAV_SELL"
        backRoute="wallet-coinmarket-sell"
        SectionComponent={CoinmarketSellOffersComponent}
    />
);
