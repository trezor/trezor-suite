import { FormProvider } from 'react-hook-form';
import { useSelector } from 'react-redux';

import { type TradingFormAccountRootState, selectTradingSendAccount } from '@suite-common/trading';

import { AllowanceContext, useAllowance } from 'src/hooks/wallet/allowance';
import { useTradingExchangeForm } from 'src/hooks/wallet/trading/form/exchange/useTradingExchangeForm';
import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingExchangeFormInputs } from 'src/views/wallet/trading/common/TradingForm/TradingExchangeFormInputs';
import { TradingFormLayout } from 'src/views/wallet/trading/common/TradingForm/TradingFormLayout';

export const TradingExchangeFormWrapper = () => {
    const tradingExchangeContextValue = useTradingExchangeForm();
    const account = useSelector((state: TradingFormAccountRootState) =>
        selectTradingSendAccount(state, 'exchange'),
    );
    const allowanceContextValue = useAllowance({ account });

    return (
        <TradingFormContext.Provider value={tradingExchangeContextValue}>
            <AllowanceContext.Provider value={allowanceContextValue}>
                <FormProvider {...tradingExchangeContextValue.methods}>
                    <TradingFormLayout>
                        <TradingExchangeFormInputs />
                    </TradingFormLayout>
                </FormProvider>
            </AllowanceContext.Provider>
        </TradingFormContext.Provider>
    );
};
