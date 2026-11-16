import { type Account } from '@suite-common/wallet-types';
import { RootStackRoutes } from '@suite-native/navigation';

type ResolveStakingHomeRouteParams = {
    account: Account;
    isStakingActive: boolean;
};

export const resolveStakingHomeRoute = ({
    account,
    isStakingActive,
}: ResolveStakingHomeRouteParams) => {
    if (isStakingActive) {
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
