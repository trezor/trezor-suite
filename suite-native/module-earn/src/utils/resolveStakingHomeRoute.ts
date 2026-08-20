import { type Account } from '@suite-common/wallet-types';
import { RootStackRoutes } from '@suite-native/navigation';

import { hasAccountActiveStaking } from './hasAccountActiveStaking';
import { resolveStakingTargetRoute } from './resolveStakingTargetRoute';

export const resolveStakingHomeRoute = (account: Account) => {
    if (hasAccountActiveStaking(account)) {
        return {
            name: resolveStakingTargetRoute(account.symbol),
            params: { accountKey: account.key },
        };
    }

    return {
        name: RootStackRoutes.HowStakeWorksScreen,
        params: { symbol: account.symbol, accountKey: account.key },
    };
};
