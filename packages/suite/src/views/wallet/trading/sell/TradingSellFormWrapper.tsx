import { Form } from '@suite/form';

import { useTradingSellForm } from 'src/hooks/wallet/trading/form/sell/useTradingSellForm';
import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingFormLayout } from 'src/views/wallet/trading/common/TradingForm/TradingFormLayout';
import { TradingSellFormInputs } from 'src/views/wallet/trading/common/TradingForm/TradingSellFormInputs';

export const TradingSellFormWrapper = () => {
    const tradingSellContextValues = useTradingSellForm();

    const { formState } = tradingSellContextValues.methods;

    return (
        <TradingFormContext.Provider value={tradingSellContextValues}>
            <Form form={tradingSellContextValues.methods} formState={formState}>
                <TradingFormLayout>
                    <TradingSellFormInputs />
                </TradingFormLayout>
            </Form>
        </TradingFormContext.Provider>
    );
};
