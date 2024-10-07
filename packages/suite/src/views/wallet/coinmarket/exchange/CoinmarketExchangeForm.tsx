import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { useCoinmarketExchangeForm } from 'src/hooks/wallet/coinmarket/form/useCoinmarketExchangeForm';
import { CoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketFormLayout } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormLayout';
import { CoinmarketLayout } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/CoinmarketLayout';
import { CoinmarketContainer } from 'src/views/wallet/coinmarket/common/CoinmarketContainer';

const CoinmarketExchangeFormComponent = ({ selectedAccount }: UseCoinmarketProps) => {
    const coinmarketExchangeContextValue = useCoinmarketExchangeForm({ selectedAccount });

    return (
        <CoinmarketLayout selectedAccount={selectedAccount}>
            <CoinmarketFormContext.Provider value={coinmarketExchangeContextValue}>
                <CoinmarketFormLayout />
            </CoinmarketFormContext.Provider>
        </CoinmarketLayout>
    );
};

export const CoinmarketExchangeForm = () => (
    <CoinmarketContainer
        title="TR_COINMARKET_SWAP"
        SectionComponent={CoinmarketExchangeFormComponent}
    />
);
