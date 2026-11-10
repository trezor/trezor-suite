import {
    AccountNotExists,
    TronStakePageHeader,
    TronUnstake,
    useEarnRouteAccount,
    useLayout,
} from '@trezor/suite';

export const EarnTronUnstakePage = () => {
    const { account } = useEarnRouteAccount();

    useLayout('Earn', <TronStakePageHeader account={account} />);

    if (!account) {
        return <AccountNotExists />;
    }

    return <TronUnstake account={account} />;
};
