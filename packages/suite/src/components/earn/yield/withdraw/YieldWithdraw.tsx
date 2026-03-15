import { useEffect } from 'react';

import { goto } from '@suite/router';

import { useDispatch } from 'src/hooks/suite';
import { AllowanceContext, useAllowance } from 'src/hooks/wallet/allowance';

import { YieldWithdrawForm } from './YieldWithdrawForm';
import { useEarnRouteAccount } from '../../utils/useEarnRouteAccount';
import { useYieldWithdraw } from '../common/useYieldWithdraw';
import { YieldWithdrawContext } from '../common/useYieldWithdrawContext';

export const YieldWithdraw = () => {
    const dispatch = useDispatch();
    const { account, routeParams } = useEarnRouteAccount();
    const allowanceContextValue = useAllowance({ account });
    const yieldWithdrawContextValue = useYieldWithdraw({
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

    if (!routeParams || !account || !yieldWithdrawContextValue) {
        return null;
    }

    return (
        <YieldWithdrawContext.Provider value={yieldWithdrawContextValue}>
            <AllowanceContext.Provider value={allowanceContextValue}>
                <YieldWithdrawForm />
            </AllowanceContext.Provider>
        </YieldWithdrawContext.Provider>
    );
};
