import { Context } from '@suite-common/message-system';
import { TradingType } from '@suite-common/trading';

import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useMessageSystemTrading } from 'src/hooks/suite/useMessageSystemTrading';
import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingExchangeForm } from 'src/hooks/wallet/trading/form/useTradingExchangeForm';
import { UseTradingProps } from 'src/types/trading/trading';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingFormLayout } from 'src/views/wallet/trading/common/TradingForm/TradingFormLayout';
import { TradingLayout } from 'src/views/wallet/trading/common/TradingLayout/TradingLayout';

import { TradingDisabled } from '../common/TradingDisabled';

const TradingExchangeFormContent = ({ selectedAccount }: UseTradingProps) => {
    const tradingExchangeContextValue = useTradingExchangeForm({ selectedAccount });

    return (
        <TradingFormContext.Provider value={tradingExchangeContextValue}>
            <TradingFormLayout />
        </TradingFormContext.Provider>
    );
};

const TradingExchangeFormWrapper = ({ selectedAccount }: UseTradingProps) => {
    const type: TradingType = 'exchange';
    const { isDisabled, content } = useMessageSystemTrading(type);

    return (
        <TradingLayout>
            <ContextMessage context={Context.tradingExchange} />
            {isDisabled ? (
                <TradingDisabled type={type} content={content} />
            ) : (
                <TradingExchangeFormContent selectedAccount={selectedAccount} />
            )}
        </TradingLayout>
    );
};

export const TradingExchangeForm = () => (
    <TradingContainer SectionComponent={TradingExchangeFormWrapper} />
);
