import { Form } from '@suite/form';

import { useTradingExchangeForm } from 'src/hooks/wallet/trading/form/exchange/useTradingExchangeForm';
import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingExchangeFormInputs } from 'src/views/wallet/trading/common/TradingForm/TradingExchangeFormInputs';
import { TradingFormLayout } from 'src/views/wallet/trading/common/TradingForm/TradingFormLayout';

export const TradingExchangeFormWrapper = () => {
    const tradingExchangeContextValue = useTradingExchangeForm();

    const { formState } = tradingExchangeContextValue.methods;

    return (
        <TradingFormContext.Provider value={tradingExchangeContextValue}>
            <Form form={tradingExchangeContextValue.methods} formState={formState}>
                <TradingFormLayout>
                    <TradingExchangeFormInputs />
                </TradingFormLayout>
            </Form>
        </TradingFormContext.Provider>
    );
};
