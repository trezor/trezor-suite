import { useEffect } from 'react';

import { goto } from 'src/actions/suite/routerActions';
import { useEarnRouteAccount } from 'src/components/earn/utils/useEarnRouteAccount';
import { YieldWithdraw } from 'src/components/earn/yield/YieldWithdraw';
import { YieldPageHeader } from 'src/components/earn/yield/common/YieldPageHeader';
import { useDispatch, useLayout } from 'src/hooks/suite';

export const EarnWithdraw = () => {
    const dispatch = useDispatch();
    const { routeParams } = useEarnRouteAccount();

    useLayout('Earn', <YieldPageHeader analyticsStep="yield-withdraw" />);

    useEffect(() => {
        if (!routeParams) {
            dispatch(goto('suite-earn'));
        }
    }, [dispatch, routeParams]);

    if (!routeParams) {
        return null;
    }

    return <YieldWithdraw />;
};
