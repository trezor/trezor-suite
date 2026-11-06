import {
    AccountNotExists,
    TronStake,
    TronStakePageHeader,
    useEarnRouteAccount,
    useLayout,
} from '@trezor/suite';

export const EarnTronStakePage = () => {
    const { account } = useEarnRouteAccount();

    useLayout('Earn', <TronStakePageHeader account={account} />);

    if (!account) {
        return <AccountNotExists />;
    }

    return <TronStake key={account.key} account={account} />;
};
