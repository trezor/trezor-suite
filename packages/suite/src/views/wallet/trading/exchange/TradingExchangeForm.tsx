import { FormProvider } from 'react-hook-form';

import { Context } from '@suite-common/message-system';
import { TradingType } from '@suite-common/trading';

import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useSelector } from 'src/hooks/suite';
import { useMessageSystemTrading } from 'src/hooks/suite/useMessageSystemTrading';
import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingExchangeForm } from 'src/hooks/wallet/trading/form/useTradingExchangeForm';
import { selectIsDeviceCompromised } from 'src/selectors/suite/suiteAuthenticityChecksSelectors';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingFormLayout } from 'src/views/wallet/trading/common/TradingForm/TradingFormLayout';
import { TradingLayout } from 'src/views/wallet/trading/common/TradingLayout/TradingLayout';

import { TradingDisabled } from '../common/TradingDisabled';
import { TradingExchangeFormInputs } from '../common/TradingForm/TradingExchangeFormInputs';

const TradingExchangeFormContent = () => {
    const tradingExchangeContextValue = useTradingExchangeForm({});

    return (
        <TradingFormContext.Provider value={tradingExchangeContextValue}>
            <FormProvider {...tradingExchangeContextValue.methods}>
                <TradingFormLayout>
                    <TradingExchangeFormInputs />
                </TradingFormLayout>
            </FormProvider>
        </TradingFormContext.Provider>
    );
};

const TradingExchangeFormWrapper = () => {
    const type: TradingType = 'exchange';
    const { isDisabled, content } = useMessageSystemTrading(type);
    const isDeviceCompromised = useSelector(selectIsDeviceCompromised);

    return (
        <TradingLayout>
            <ContextMessage context={Context.getTrading(type)} />
            {isDisabled || isDeviceCompromised ? (
                <TradingDisabled type={type} content={content} />
            ) : (
                <TradingExchangeFormContent />
            )}
        </TradingLayout>
    );
};

export const TradingExchangeForm = () => (
    <TradingContainer SectionComponent={TradingExchangeFormWrapper} />
);
