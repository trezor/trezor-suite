import { FormProvider } from 'react-hook-form';

import { selectIsDeviceCompromised } from '@suite/authenticity-checks';
import { ContextMessage } from '@suite/message-system';
import { useServices } from '@suite-common/dependency-injection';
import { Context } from '@suite-common/message-system';
import { type TradingType, selectTradingSendAccount } from '@suite-common/trading';
import { selectNetworkConfigDeps } from '@suite-common/wallet-config';

import { useSelector } from 'src/hooks/suite';
import { useMessageSystemTrading } from 'src/hooks/suite/useMessageSystemTrading';
import { AllowanceContext, useAllowance } from 'src/hooks/wallet/allowance';
import { useTradingExchangeForm } from 'src/hooks/wallet/trading/form/exchange/useTradingExchangeForm';
import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingContainer } from 'src/views/wallet/trading/common/TradingContainer';
import { TradingFormLayout } from 'src/views/wallet/trading/common/TradingForm/TradingFormLayout';
import { TradingLayout } from 'src/views/wallet/trading/common/TradingLayout/TradingLayout';

import { TradingDisabled } from '../common/TradingDisabled';
import { TradingExchangeFormInputs } from '../common/TradingForm/TradingExchangeFormInputs';

const TradingExchangeFormWrapper = () => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);
    const tradingExchangeContextValue = useTradingExchangeForm();
    const account = useSelector(state =>
        selectTradingSendAccount(state, 'exchange', networkConfigDeps),
    );
    const allowanceContextValue = useAllowance({ account });

    return (
        <TradingFormContext.Provider value={tradingExchangeContextValue}>
            <AllowanceContext.Provider value={allowanceContextValue}>
                <FormProvider {...tradingExchangeContextValue.methods}>
                    <TradingContainer>
                        <TradingFormLayout>
                            <TradingExchangeFormInputs />
                        </TradingFormLayout>
                    </TradingContainer>
                </FormProvider>
            </AllowanceContext.Provider>
        </TradingFormContext.Provider>
    );
};

export const TradingExchangeForm = () => {
    const type: TradingType = 'exchange';
    const { isDisabled, content } = useMessageSystemTrading(type);
    const isDeviceCompromised = useSelector(selectIsDeviceCompromised);

    return (
        <TradingLayout>
            <ContextMessage context={Context.getTrading(type)} />
            {isDisabled || isDeviceCompromised ? (
                <TradingDisabled type={type} content={content} />
            ) : (
                <TradingExchangeFormWrapper />
            )}
        </TradingLayout>
    );
};
