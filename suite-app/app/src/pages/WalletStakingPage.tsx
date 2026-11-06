import { selectFullSelectedAccount } from '@suite/account';
import { Translation } from '@suite/intl';
import { hasNetworkFeatures } from '@suite-common/wallet-utils';
import { WarningIcon } from '@trezor/icons';
import {
    AccountExceptionLayout,
    AdaStakingDashboard,
    EthStakingDashboard,
    SolStakingDashboard,
    TronStakingDashboard,
    WalletLayout,
    useSelector,
} from '@trezor/suite';

export const WalletStakingPage = () => {
    const selectedAccount = useSelector(selectFullSelectedAccount);

    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_EARN_STAKING" account={selectedAccount} />;
    }

    if (hasNetworkFeatures(selectedAccount.account, 'staking')) {
        switch (selectedAccount.account.networkType) {
            case 'cardano':
                return <AdaStakingDashboard selectedAccount={selectedAccount} />;
            case 'ethereum':
                return <EthStakingDashboard selectedAccount={selectedAccount} />;
            case 'solana':
                return <SolStakingDashboard selectedAccount={selectedAccount} />;
            case 'tron':
                return <TronStakingDashboard selectedAccount={selectedAccount} />;
            // no default
        }
    }

    return (
        <WalletLayout title="TR_EARN_STAKING" account={selectedAccount}>
            <AccountExceptionLayout
                title={<Translation id="TR_STAKING_IS_NOT_SUPPORTED" />}
                icon={WarningIcon}
                iconVariant="warning"
            />
        </WalletLayout>
    );
};
