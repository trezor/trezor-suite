import {
    AccountNotExists,
    YieldClaim,
    YieldClaimPageHeader,
    useEarnRouteAccount,
    useLayout,
} from '@trezor/suite';

export const EarnClaimPage = () => {
    const { account } = useEarnRouteAccount();

    useLayout('Earn', <YieldClaimPageHeader account={account} />);

    if (!account) {
        return <AccountNotExists />;
    }

    return <YieldClaim account={account} />;
};
