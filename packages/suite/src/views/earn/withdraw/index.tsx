import { YieldWithdraw } from 'src/components/earn';

import { useEarnLayout } from '../useEarnLayout';

export const EarnWithdraw = () => {
    const { account, routeParams } = useEarnLayout({ analyticsStep: 'yield-withdraw' });

    if (!account || !routeParams) {
        return null;
    }

    return <YieldWithdraw account={account} routeParams={routeParams} />;
};
