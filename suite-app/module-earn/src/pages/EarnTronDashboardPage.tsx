import {
    AccountNotExists,
    TronStakePageHeader,
    TronStakingDashboard,
    useLayout,
    useTronStakingRouteAccount,
} from '@trezor/suite';

export const EarnTronDashboardPage = () => {
    const account = useTronStakingRouteAccount();

    useLayout('Earn', <TronStakePageHeader account={account} />);

    if (!account) {
        return <AccountNotExists />;
    }

    return <TronStakingDashboard key={account.key} account={account} />;
};
