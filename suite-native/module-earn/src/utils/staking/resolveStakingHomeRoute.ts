import { type Account } from '@suite-common/wallet-types';
import { RootStackRoutes } from '@suite-native/navigation';

import { hasAccountActiveStaking } from './hasAccountActiveStaking';

export const resolveStakingHomeRoute = (account: Account) => {
    if (hasAccountActiveStaking(account)) {
        return {
            name: RootStackRoutes.StakingManagement,
            params: { accountKey: account.key },
        };
    }

    return {
        name: RootStackRoutes.HowStakeWorksScreen,
        params: { symbol: account.symbol, accountKey: account.key },
    };
};
