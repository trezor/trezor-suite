import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketOffers } from 'src/views/wallet/coinmarket/common/CoinmarketOffers/CoinmarketOffers';
import { CoinmarketFooter } from 'src/views/wallet/coinmarket/common';
import { useCoinmarketExchangeForm } from 'src/hooks/wallet/coinmarket/form/useCoinmarketExchangeForm';
import { CoinmarketContainer } from 'src/views/wallet/coinmarket/common/CoinmarketContainer';
import { CoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';

const CoinmarketExchangeOffersComponent = ({ selectedAccount }: UseCoinmarketProps) => {
    const coinmarketExchangeContextValues = useCoinmarketExchangeForm({
        selectedAccount,
        pageType: 'offers',
    });

    return (
        <CoinmarketFormContext.Provider value={coinmarketExchangeContextValues}>
            <CoinmarketOffers />
            <CoinmarketFooter />
        </CoinmarketFormContext.Provider>
    );
};

export const CoinmarketExchangeOffers = () => (
    <CoinmarketContainer
        title="TR_COINMARKET_SWAP"
        backRoute="wallet-coinmarket-exchange"
        SectionComponent={CoinmarketExchangeOffersComponent}
    />
);
