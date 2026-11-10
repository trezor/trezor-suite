import { Form } from '@suite/form';

import { useTradingBuyForm } from '../../../../hooks/wallet/trading/form/buy/useTradingBuyForm';
import { TradingFormContext } from '../../../../hooks/wallet/trading/form/useTradingCommonForm';
import { TradingBuyFormInputs } from '../common/TradingForm/TradingBuyFormInputs';
import { TradingFormLayout } from '../common/TradingForm/TradingFormLayout';

export const TradingBuyFormWrapper = () => {
    const tradingBuyContextValues = useTradingBuyForm();

    const { formState } = tradingBuyContextValues.methods;

    return (
        <TradingFormContext.Provider value={tradingBuyContextValues}>
            <Form form={tradingBuyContextValues.methods} formState={formState}>
                <TradingFormLayout>
                    <TradingBuyFormInputs />
                </TradingFormLayout>
            </Form>
        </TradingFormContext.Provider>
    );
};
