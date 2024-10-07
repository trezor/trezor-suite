import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { useCoinmarketBuyForm } from 'src/hooks/wallet/coinmarket/form/useCoinmarketBuyForm';
import { CoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketFormLayout } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormLayout';
import { CoinmarketLayout } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/CoinmarketLayout';
import { CoinmarketContainer } from 'src/views/wallet/coinmarket/common/CoinmarketContainer';

const CoinmarketBuyComponent = ({ selectedAccount }: UseCoinmarketProps) => {
    const coinmarketBuyContextValues = useCoinmarketBuyForm({ selectedAccount });

    return (
        <CoinmarketLayout selectedAccount={selectedAccount}>
            <CoinmarketFormContext.Provider value={coinmarketBuyContextValues}>
                <CoinmarketFormLayout />
            </CoinmarketFormContext.Provider>
        </CoinmarketLayout>
    );
};

export const CoinmarketBuyForm = () => (
    <CoinmarketContainer title="TR_NAV_BUY" SectionComponent={CoinmarketBuyComponent} />
);
