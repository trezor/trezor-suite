import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketOffersContext } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { CoinmarketOffers } from 'src/views/wallet/coinmarket/common/CoinmarketOffers/CoinmarketOffers';
import { CoinmarketFooter } from 'src/views/wallet/coinmarket/common';
import { useCoinmarketExchangeForm } from 'src/hooks/wallet/coinmarket/form/useCoinmarketExchangeForm';
import { CoinmarketContainer } from 'src/views/wallet/coinmarket/common/CoinmarketContainer';

const CoinmarketExchangeOffersComponent = ({ selectedAccount }: UseCoinmarketProps) => {
    const coinmarketExchangeContextValues = useCoinmarketExchangeForm({
        selectedAccount,
        pageType: 'offers',
    });

    return (
        <CoinmarketOffersContext.Provider value={coinmarketExchangeContextValues}>
            <CoinmarketOffers />
            <CoinmarketFooter />
        </CoinmarketOffersContext.Provider>
    );
};

export const CoinmarketExchangeOffers = () => (
    <CoinmarketContainer
        title="TR_COINMARKET_SWAP"
        backRoute="wallet-coinmarket-exchange"
        SectionComponent={CoinmarketExchangeOffersComponent}
    />
);
