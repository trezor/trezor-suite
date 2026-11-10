import { Form } from '@suite/form';

import { useTradingExchangeForm } from '../../../../hooks/wallet/trading/form/exchange/useTradingExchangeForm';
import { TradingFormContext } from '../../../../hooks/wallet/trading/form/useTradingCommonForm';
import { TradingExchangeFormInputs } from '../common/TradingForm/TradingExchangeFormInputs';
import { TradingFormLayout } from '../common/TradingForm/TradingFormLayout';

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
