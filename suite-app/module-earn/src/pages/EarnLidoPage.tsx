import {
    AccountNotExists,
    LidoDashboard,
    LidoStakePageHeader,
    useLayout,
    useLidoRouteAccount,
} from '@trezor/suite';

export const EarnLidoPage = () => {
    const account = useLidoRouteAccount();

    useLayout('Earn', <LidoStakePageHeader account={account} />);

    if (!account) {
        return <AccountNotExists />;
    }

    return <LidoDashboard key={account.key} account={account} />;
};
