import {
    AccountNotExists,
    TronStake,
    TronStakePageHeader,
    useLayout,
    useTronStakingRouteAccount,
} from '@trezor/suite';

export const EarnTronStakePage = () => {
    const account = useTronStakingRouteAccount();

    useLayout('Earn', <TronStakePageHeader account={account} />);

    if (!account) {
        return <AccountNotExists />;
    }

    return <TronStake key={account.key} account={account} />;
};
