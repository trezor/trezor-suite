import {
    AccountNotExists,
    TronStakePageHeader,
    TronUnstake,
    useLayout,
    useTronStakingRouteAccount,
} from '@trezor/suite';

export const EarnTronUnstakePage = () => {
    const account = useTronStakingRouteAccount();

    useLayout('Earn', <TronStakePageHeader account={account} />);

    if (!account) {
        return <AccountNotExists />;
    }

    return <TronUnstake account={account} />;
};
