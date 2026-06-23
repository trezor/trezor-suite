import { TronStakePageHeader, TronWithdraw } from 'src/components/earn';
import { useEarnRouteAccount } from 'src/components/earn/utils/useEarnRouteAccount';
import { AccountNotExists } from 'src/components/wallet/WalletLayout/AccountException/AccountNotExists';
import { useLayout } from 'src/hooks/suite';

export const EarnTronWithdraw = () => {
    const { account } = useEarnRouteAccount();

    useLayout('Earn', <TronStakePageHeader account={account} />);

    if (!account) {
        return <AccountNotExists />;
    }

    return <TronWithdraw account={account} />;
};
