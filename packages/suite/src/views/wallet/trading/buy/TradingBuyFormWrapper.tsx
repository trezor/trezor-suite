import { FormProvider } from 'react-hook-form';

import { useTradingBuyForm } from 'src/hooks/wallet/trading/form/buy/useTradingBuyForm';
import { TradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingBuyFormInputs } from 'src/views/wallet/trading/common/TradingForm/TradingBuyFormInputs';
import { TradingFormLayout } from 'src/views/wallet/trading/common/TradingForm/TradingFormLayout';

export const TradingBuyFormWrapper = () => {
    const tradingBuyContextValues = useTradingBuyForm();

    return (
        <TradingFormContext.Provider value={tradingBuyContextValues}>
            <FormProvider {...tradingBuyContextValues.methods}>
                <TradingFormLayout>
                    <TradingBuyFormInputs />
                </TradingFormLayout>
            </FormProvider>
        </TradingFormContext.Provider>
    );
};
