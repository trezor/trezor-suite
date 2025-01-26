import { UseTradingProps } from 'src/types/trading/trading';
import { useTradingExchangeForm } from 'src/hooks/wallet/trading/form/useTradingExchangeForm';
import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingFormLayout } from 'src/views/wallet/trading/common/TradingForm/TradingFormLayout';
import { TradingLayout } from 'src/views/wallet/trading/common/TradingLayout/TradingLayout';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';

const TradingExchangeFormComponent = ({ selectedAccount }: UseTradingProps) => {
    const tradingExchangeContextValue = useTradingExchangeForm({ selectedAccount });

    return (
        <TradingLayout>
            <TradingFormContext.Provider value={tradingExchangeContextValue}>
                <TradingFormLayout />
            </TradingFormContext.Provider>
        </TradingLayout>
    );
};

export const TradingExchangeForm = () => (
    <TradingContainer SectionComponent={TradingExchangeFormComponent} />
);
