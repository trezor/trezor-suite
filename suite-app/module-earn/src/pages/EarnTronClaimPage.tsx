import {
    AccountNotExists,
    TronClaim,
    TronStakePageHeader,
    useLayout,
    useTronStakingRouteAccount,
} from '@trezor/suite';

export const EarnTronClaimPage = () => {
    const account = useTronStakingRouteAccount();

    useLayout('Earn', <TronStakePageHeader account={account} />);

    if (!account) {
        return <AccountNotExists />;
    }

    return <TronClaim account={account} />;
};
