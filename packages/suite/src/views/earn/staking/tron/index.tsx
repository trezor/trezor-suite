import { useEarnRouteAccount } from 'src/components/earn/utils/useEarnRouteAccount';
import { AccountNotExists } from 'src/components/wallet/WalletLayout/AccountException/AccountNotExists';

export const EarnStakingTron = () => {
    const { account } = useEarnRouteAccount();

    if (!account) {
        return <AccountNotExists />;
    }

    return null;
};
