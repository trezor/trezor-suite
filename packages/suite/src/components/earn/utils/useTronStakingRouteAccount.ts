import { selectRouter, tronStakingProductId } from '@suite/router';
import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';

import { useSelector } from '#src/hooks/suite/useSelector';

import { useEarnRouteAccount } from './useEarnRouteAccount';

export const useTronStakingRouteAccount = () => {
    const { route, hash } = useSelector(selectRouter);
    const { account } = useEarnRouteAccount();
    const defaultAccount = useSelector(state =>
        route?.name === 'earn-staking-tron' && !hash
            ? selectVisibleDeviceAccounts(state).find(candidate => candidate.symbol === 'trx')
            : undefined,
    );

    if (route?.stakingProductId === tronStakingProductId) {
        return defaultAccount ?? (account?.symbol === 'trx' ? account : undefined);
    }
};
