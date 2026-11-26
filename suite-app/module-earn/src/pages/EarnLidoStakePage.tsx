import {
    AccountNotExists,
    LidoFlowLayout,
    LidoStake,
    LidoStakePageHeader,
    useLayout,
    useLidoRouteAccount,
} from '@trezor/suite';

export const EarnLidoStakePage = () => {
    const account = useLidoRouteAccount();

    useLayout('Earn', <LidoStakePageHeader account={account} />);

    if (!account) {
        return <AccountNotExists />;
    }

    return (
        <LidoFlowLayout>
            <LidoStake key={account.key} account={account} />
        </LidoFlowLayout>
    );
};
