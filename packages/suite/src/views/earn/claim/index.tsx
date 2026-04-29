import { YieldClaim, YieldClaimPageHeader } from 'src/components/earn';
import { useEarnRouteAccount } from 'src/components/earn/utils/useEarnRouteAccount';
import { useLayout } from 'src/hooks/suite';

export const EarnClaim = () => {
    const { account } = useEarnRouteAccount();

    useLayout('Earn', <YieldClaimPageHeader account={account} />);

    return <YieldClaim account={account} />;
};
