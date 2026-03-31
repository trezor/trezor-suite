import { YieldSupply } from 'src/components/earn';

import { useEarnLayout } from '../useEarnLayout';

export const EarnSupply = () => {
    const { account, routeParams } = useEarnLayout({ analyticsStep: 'yield-supply' });

    if (!account || !routeParams) {
        return null;
    }

    return <YieldSupply account={account} routeParams={routeParams} />;
};
