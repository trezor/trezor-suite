import { useEffect } from 'react';

import { goto } from '@suite/router';

import { useDispatch } from 'src/hooks/suite';
import { AllowanceContext, useAllowance } from 'src/hooks/wallet/allowance';

import { YieldSupplyForm } from './YieldSupplyForm';
import { useEarnRouteAccount } from '../../utils/useEarnRouteAccount';
import { useYieldSupply } from '../common/useYieldSupply';
import { YieldSupplyContext } from '../common/useYieldSupplyContext';

export const YieldSupply = () => {
    const dispatch = useDispatch();
    const { account, routeParams } = useEarnRouteAccount();
    const allowanceContextValue = useAllowance({ account });
    const yieldSupplyContextValue = useYieldSupply({
        account,
        allowanceContextValue,
        yieldId: routeParams?.yieldId,
        contractAddress: routeParams?.contractAddress ?? undefined,
    });

    useEffect(() => {
        if (!routeParams) {
            dispatch(goto({ routeName: 'suite-earn' }));
        }
    }, [dispatch, routeParams]);

    if (!routeParams || !account || !yieldSupplyContextValue) {
        return null;
    }

    return (
        <YieldSupplyContext.Provider value={yieldSupplyContextValue}>
            <AllowanceContext.Provider value={allowanceContextValue}>
                <YieldSupplyForm />
            </AllowanceContext.Provider>
        </YieldSupplyContext.Provider>
    );
};
