import { FormProvider } from 'react-hook-form';

import { YieldWithdrawForm } from './YieldWithdrawForm';
import { useYieldWithdraw } from './useYieldWithdraw';
import { YieldWithdrawContext } from './useYieldWithdrawContext';

export const YieldWithdraw = () => {
    const yieldWithdrawContextValues = useYieldWithdraw();

    if (!yieldWithdrawContextValues) {
        return null;
    }

    return (
        <YieldWithdrawContext.Provider value={yieldWithdrawContextValues}>
            <FormProvider {...yieldWithdrawContextValues.methods}>
                <YieldWithdrawForm />
            </FormProvider>
        </YieldWithdrawContext.Provider>
    );
};
