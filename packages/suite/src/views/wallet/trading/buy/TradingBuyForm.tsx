import { UseTradingProps } from 'src/types/trading/trading';
import { useTradingBuyForm } from 'src/hooks/wallet/trading/form/useTradingBuyForm';
import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingFormLayout } from 'src/views/wallet/trading/common/TradingForm/TradingFormLayout';
import { TradingLayout } from 'src/views/wallet/trading/common/TradingLayout/TradingLayout';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';

const TradingBuyComponent = ({ selectedAccount }: UseTradingProps) => {
    const tradingBuyContextValues = useTradingBuyForm({ selectedAccount });

    return (
        <TradingLayout>
            <TradingFormContext.Provider value={tradingBuyContextValues}>
                <TradingFormLayout />
            </TradingFormContext.Provider>
        </TradingLayout>
    );
};

export const TradingBuyForm = () => <TradingContainer SectionComponent={TradingBuyComponent} />;
