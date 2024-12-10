import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { useCoinmarketBuyForm } from 'src/hooks/wallet/coinmarket/form/useCoinmarketBuyForm';
import { CoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketFormLayout } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormLayout';
import { CoinmarketContainer } from 'src/views/wallet/coinmarket/common/CoinmarketContainer';

const CoinmarketBuyComponent = ({ selectedAccount }: UseCoinmarketProps) => {
    const coinmarketBuyContextValues = useCoinmarketBuyForm({ selectedAccount });

    return (
        <CoinmarketFormContext.Provider value={coinmarketBuyContextValues}>
            <CoinmarketFormLayout />
        </CoinmarketFormContext.Provider>
    );
};

export const CoinmarketBuyForm = () => (
    <CoinmarketContainer SectionComponent={CoinmarketBuyComponent} />
);
