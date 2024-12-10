import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { useCoinmarketExchangeForm } from 'src/hooks/wallet/coinmarket/form/useCoinmarketExchangeForm';
import { CoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { CoinmarketFormLayout } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormLayout';
import { CoinmarketContainer } from 'src/views/wallet/coinmarket/common/CoinmarketContainer';

const CoinmarketExchangeFormComponent = ({ selectedAccount }: UseCoinmarketProps) => {
    const coinmarketExchangeContextValue = useCoinmarketExchangeForm({ selectedAccount });

    return (
        <CoinmarketFormContext.Provider value={coinmarketExchangeContextValue}>
            <CoinmarketFormLayout />
        </CoinmarketFormContext.Provider>
    );
};

export const CoinmarketExchangeForm = () => (
    <CoinmarketContainer SectionComponent={CoinmarketExchangeFormComponent} />
);
