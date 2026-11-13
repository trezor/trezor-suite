import {
    AccountNotExists,
    TronClaim,
    TronStakePageHeader,
    useEarnRouteAccount,
    useLayout,
} from '@trezor/suite';

export const EarnTronClaimPage = () => {
    const { account } = useEarnRouteAccount();

    useLayout('Earn', <TronStakePageHeader account={account} />);

    if (!account) {
        return <AccountNotExists />;
    }

    return <TronClaim account={account} />;
};
