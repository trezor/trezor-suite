import { FormProvider } from 'react-hook-form';

import { useTradingSellForm } from 'src/hooks/wallet/trading/form/sell/useTradingSellForm';
import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingFormLayout } from 'src/views/wallet/trading/common/TradingForm/TradingFormLayout';
import { TradingSellFormInputs } from 'src/views/wallet/trading/common/TradingForm/TradingSellFormInputs';

export const TradingSellFormWrapper = () => {
    const tradingSellContextValues = useTradingSellForm();

    return (
        <TradingFormContext.Provider value={tradingSellContextValues}>
            <FormProvider {...tradingSellContextValues.methods}>
                <TradingFormLayout>
                    <TradingSellFormInputs />
                </TradingFormLayout>
            </FormProvider>
        </TradingFormContext.Provider>
    );
};
