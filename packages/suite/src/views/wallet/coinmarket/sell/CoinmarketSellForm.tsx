import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketFormLayout } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormLayout';
import { CoinmarketLayout } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/CoinmarketLayout';
import { useCoinmarketSellForm } from 'src/hooks/wallet/coinmarket/form/useCoinmarketSellForm';
import { CoinmarketContainer } from 'src/views/wallet/coinmarket/common/CoinmarketContainer';

const CoinmarketSellFormComponent = ({ selectedAccount }: UseCoinmarketProps) => {
    const coinmarketSellContextValues = useCoinmarketSellForm({ selectedAccount });

    return (
        <CoinmarketLayout>
            <CoinmarketFormContext.Provider value={coinmarketSellContextValues}>
                <CoinmarketFormLayout />
            </CoinmarketFormContext.Provider>
        </CoinmarketLayout>
    );
};

export const CoinmarketSellForm = () => (
    <CoinmarketContainer
        title="TR_COINMARKET_BUY_AND_SELL"
        SectionComponent={CoinmarketSellFormComponent}
    />
);
