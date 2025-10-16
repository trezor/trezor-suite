import { FormProvider } from 'react-hook-form';

import { Context } from '@suite-common/message-system';
import { TradingType } from '@suite-common/trading';

import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useSelector } from 'src/hooks/suite';
import { useMessageSystemTrading } from 'src/hooks/suite/useMessageSystemTrading';
import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingExchangeForm } from 'src/hooks/wallet/trading/form/useTradingExchangeForm';
import { selectIsDeviceCompromised } from 'src/selectors/suite/suiteAuthenticityChecksSelectors';
import { UseTradingProps } from 'src/types/trading/trading';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingFormLayout } from 'src/views/wallet/trading/common/TradingForm/TradingFormLayout';
import { TradingLayout } from 'src/views/wallet/trading/common/TradingLayout/TradingLayout';

import { TradingDisabled } from '../common/TradingDisabled';

const TradingExchangeFormContent = ({ selectedAccount }: UseTradingProps) => {
    const tradingExchangeContextValue = useTradingExchangeForm({ selectedAccount });

    return (
        <TradingFormContext.Provider value={tradingExchangeContextValue}>
            <FormProvider {...tradingExchangeContextValue.methods}>
                <TradingFormLayout />
            </FormProvider>
        </TradingFormContext.Provider>
    );
};

const TradingExchangeFormWrapper = ({ selectedAccount }: UseTradingProps) => {
    const type: TradingType = 'exchange';
    const { isDisabled, content } = useMessageSystemTrading(type);
    const isDeviceCompromised = useSelector(selectIsDeviceCompromised);

    return (
        <TradingLayout>
            <ContextMessage context={Context.getTrading(type)} />
            {isDisabled || isDeviceCompromised ? (
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
