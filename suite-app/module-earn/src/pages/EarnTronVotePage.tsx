import {
    AccountNotExists,
    TronStakePageHeader,
    TronVote,
    useEarnRouteAccount,
    useLayout,
} from '@trezor/suite';

export const EarnTronVotePage = () => {
    const { account } = useEarnRouteAccount();

    useLayout('Earn', <TronStakePageHeader account={account} />);

    if (!account) {
        return <AccountNotExists />;
    }

    return <TronVote key={account.key} account={account} />;
};
