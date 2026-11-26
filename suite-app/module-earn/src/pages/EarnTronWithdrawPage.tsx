import {
    AccountNotExists,
    TronStakePageHeader,
    TronWithdraw,
    useLayout,
    useTronStakingRouteAccount,
} from '@trezor/suite';

export const EarnTronWithdrawPage = () => {
    const account = useTronStakingRouteAccount();

    useLayout('Earn', <TronStakePageHeader account={account} />);

    if (!account) {
        return <AccountNotExists />;
    }

    return <TronWithdraw account={account} />;
};
