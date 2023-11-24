import { Translation } from 'src/components/suite';
import { AccountExceptionLayout, WalletLayout } from 'src/components/wallet';
import { useSelector } from 'src/hooks/suite';
import { CardanoStakingDashboard } from './components/CardanoStakingDashboard';
import { hasNetworkFeatures } from '@suite-common/wallet-utils';
import { EthStakingDashboard } from './components/EthStakingDashboard';

export const WalletStaking = () => {
    const { selectedAccount } = useSelector(state => state.wallet);

    if (selectedAccount.status !== 'loaded') {
        return (
            <WalletLayout
                title="TR_NAV_STAKING"
                account={selectedAccount}
                showEmptyHeaderPlaceholder
            />
        );
    }

    if (hasNetworkFeatures(selectedAccount.account, 'staking')) {
        switch (selectedAccount.account.networkType) {
            case 'cardano':
                return <CardanoStakingDashboard selectedAccount={selectedAccount} />;
            case 'ethereum':
                return <EthStakingDashboard selectedAccount={selectedAccount} />;
            // no default
        }
    }

    return (
        <WalletLayout title="TR_NAV_STAKING" account={selectedAccount} showEmptyHeaderPlaceholder>
            <AccountExceptionLayout
                title={<Translation id="TR_STAKING_IS_NOT_SUPPORTED" />}
                image="CLOUDY"
            />
        </WalletLayout>
    );
};
