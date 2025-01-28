import { useTradingBuyForm } from 'src/hooks/wallet/trading/form/useTradingBuyForm';
import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { UseTradingProps } from 'src/types/trading/trading';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingFormLayout } from 'src/views/wallet/trading/common/TradingForm/TradingFormLayout';
import { TradingLayout } from 'src/views/wallet/trading/common/TradingLayout/TradingLayout';

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
