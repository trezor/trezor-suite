import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketFormLayout } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormLayout';
import { useCoinmarketSellForm } from 'src/hooks/wallet/coinmarket/form/useCoinmarketSellForm';
import { CoinmarketContainer } from 'src/views/wallet/coinmarket/common/CoinmarketContainer';

const CoinmarketSellFormComponent = ({ selectedAccount }: UseCoinmarketProps) => {
    const coinmarketSellContextValues = useCoinmarketSellForm({ selectedAccount });

    return (
        <CoinmarketFormContext.Provider value={coinmarketSellContextValues}>
            <CoinmarketFormLayout />
        </CoinmarketFormContext.Provider>
    );
};

export const CoinmarketSellForm = () => (
    <CoinmarketContainer SectionComponent={CoinmarketSellFormComponent} />
);
