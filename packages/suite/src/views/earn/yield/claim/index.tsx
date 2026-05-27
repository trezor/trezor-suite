import { YieldClaim, YieldClaimPageHeader } from 'src/components/earn';
import { useEarnRouteAccount } from 'src/components/earn/utils/useEarnRouteAccount';
import { AccountNotExists } from 'src/components/wallet/WalletLayout/AccountException/AccountNotExists';
import { useLayout } from 'src/hooks/suite';

export const EarnClaim = () => {
    const { account } = useEarnRouteAccount();

    useLayout('Earn', <YieldClaimPageHeader account={account} />);

    if (!account) {
        return <AccountNotExists />;
    }

    return <YieldClaim account={account} />;
};
