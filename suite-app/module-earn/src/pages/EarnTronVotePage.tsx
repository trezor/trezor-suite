import {
    AccountNotExists,
    TronStakePageHeader,
    TronVote,
    useLayout,
    useTronStakingRouteAccount,
} from '@trezor/suite';

export const EarnTronVotePage = () => {
    const account = useTronStakingRouteAccount();

    useLayout('Earn', <TronStakePageHeader account={account} />);

    if (!account) {
        return <AccountNotExists />;
    }

    return <TronVote key={account.key} account={account} />;
};
