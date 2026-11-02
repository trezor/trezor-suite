import { Form } from '@suite/form';

import { useTradingBuyForm } from 'src/hooks/wallet/trading/form/buy/useTradingBuyForm';
import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingBuyFormInputs } from 'src/views/wallet/trading/common/TradingForm/TradingBuyFormInputs';
import { TradingFormLayout } from 'src/views/wallet/trading/common/TradingForm/TradingFormLayout';

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
