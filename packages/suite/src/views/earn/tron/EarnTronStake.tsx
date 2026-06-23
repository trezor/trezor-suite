import { TronStake, TronStakePageHeader } from 'src/components/earn';
import { useEarnRouteAccount } from 'src/components/earn/utils/useEarnRouteAccount';
import { AccountNotExists } from 'src/components/wallet/WalletLayout/AccountException/AccountNotExists';
import { useLayout } from 'src/hooks/suite';

export const EarnTronStake = () => {
    const { account } = useEarnRouteAccount();

    useLayout('Earn', <TronStakePageHeader account={account} />);

    if (!account) {
        return <AccountNotExists />;
    }

    return <TronStake account={account} />;
};
