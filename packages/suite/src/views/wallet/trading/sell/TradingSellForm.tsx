import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingSellForm } from 'src/hooks/wallet/trading/form/useTradingSellForm';
import { UseTradingProps } from 'src/types/trading/trading';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingFormLayout } from 'src/views/wallet/trading/common/TradingForm/TradingFormLayout';
import { TradingLayout } from 'src/views/wallet/trading/common/TradingLayout/TradingLayout';

const TradingSellFormComponent = ({ selectedAccount }: UseTradingProps) => {
    const tradingSellContextValues = useTradingSellForm({ selectedAccount });

    return (
        <TradingLayout>
            <TradingFormContext.Provider value={tradingSellContextValues}>
                <TradingFormLayout />
            </TradingFormContext.Provider>
        </TradingLayout>
    );
};

export const TradingSellForm = () => (
    <TradingContainer SectionComponent={TradingSellFormComponent} />
);
