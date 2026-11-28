import {
    AccountNotExists,
    LidoFlowLayout,
    LidoStakePageHeader,
    LidoUnstake,
    useLayout,
    useLidoRouteAccount,
} from '@trezor/suite';

export const EarnLidoUnstakePage = () => {
    const account = useLidoRouteAccount();

    useLayout('Earn', <LidoStakePageHeader account={account} />);

    if (!account) {
        return <AccountNotExists />;
    }

    return (
        <LidoFlowLayout>
            <LidoUnstake key={account.key} account={account} />
        </LidoFlowLayout>
    );
};
