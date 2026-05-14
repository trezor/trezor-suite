import { useEffect } from 'react';

import { goto } from '@suite/router';
import { type EarnAnalyticsStep } from '@suite-common/suite-types/src/staking';

import { YieldPageHeader } from 'src/components/earn';
import { useEarnRouteAccount } from 'src/components/earn/utils/useEarnRouteAccount';
import { useDispatch, useLayout } from 'src/hooks/suite';

type EarnYieldAnalyticsStep = Extract<EarnAnalyticsStep, 'yield-supply' | 'yield-withdraw'>;

type UseEarnLayoutParams = {
    analyticsStep: EarnYieldAnalyticsStep;
};

export const useEarnLayout = ({ analyticsStep }: UseEarnLayoutParams) => {
    const dispatch = useDispatch();
    const { account, routeParams } = useEarnRouteAccount();

    useEffect(() => {
        if (!routeParams) {
            dispatch(goto({ routeName: 'suite-earn' }));
        }
    }, [dispatch, routeParams]);

    useLayout(
        'Earn',
        <YieldPageHeader
            analyticsStep={analyticsStep}
            account={account}
            routeParams={routeParams}
        />,
    );

    return {
        account,
        routeParams,
    };
};
