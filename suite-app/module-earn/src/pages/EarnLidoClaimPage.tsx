import {
    AccountNotExists,
    LidoClaim,
    LidoFlowLayout,
    LidoStakePageHeader,
    useLayout,
    useLidoRouteAccount,
} from '@trezor/suite';

export const EarnLidoClaimPage = () => {
    const account = useLidoRouteAccount();

    useLayout('Earn', <LidoStakePageHeader account={account} />);

    if (!account) {
        return <AccountNotExists />;
    }

    return (
        <LidoFlowLayout>
            <LidoClaim key={account.key} account={account} />
        </LidoFlowLayout>
    );
};
