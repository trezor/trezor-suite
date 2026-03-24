import { FormProvider } from 'react-hook-form';

import { YieldSupplyForm } from './YieldSupplyForm';
import { useYieldSupply } from './useYieldSupply';
import { YieldSupplyContext } from './useYieldSupplyContext';

export const YieldSupply = () => {
    const yieldSupplyContextValues = useYieldSupply();

    if (!yieldSupplyContextValues) {
        return null;
    }

    return (
        <YieldSupplyContext.Provider value={yieldSupplyContextValues}>
            <FormProvider {...yieldSupplyContextValues.methods}>
                <YieldSupplyForm />
            </FormProvider>
        </YieldSupplyContext.Provider>
    );
};
