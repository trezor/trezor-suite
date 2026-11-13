import {
    AccountNotExists,
    TronStakePageHeader,
    TronWithdraw,
    useEarnRouteAccount,
    useLayout,
} from '@trezor/suite';

export const EarnTronWithdrawPage = () => {
    const { account } = useEarnRouteAccount();

    useLayout('Earn', <TronStakePageHeader account={account} />);

    if (!account) {
        return <AccountNotExists />;
    }

    return <TronWithdraw account={account} />;
};
