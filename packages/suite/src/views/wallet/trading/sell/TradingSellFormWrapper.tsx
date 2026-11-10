import { Form } from '@suite/form';

import { useTradingSellForm } from '../../../../hooks/wallet/trading/form/sell/useTradingSellForm';
import { TradingFormContext } from '../../../../hooks/wallet/trading/form/useTradingCommonForm';
import { TradingFormLayout } from '../common/TradingForm/TradingFormLayout';
import { TradingSellFormInputs } from '../common/TradingForm/TradingSellFormInputs';

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
