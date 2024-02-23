import { Translation } from 'src/components/suite';
import { AccountExceptionLayout, WalletLayout } from 'src/components/wallet';
import { useSelector } from 'src/hooks/suite';
import { CardanoStakingDashboard } from './components/CardanoStakingDashboard';
import { hasNetworkFeatures } from '@suite-common/wallet-utils';
import { EthStakingDashboard } from './components/EthStakingDashboard/EthStakingDashboard';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';

export const WalletStaking = () => {
    const { selectedAccount } = useSelector(state => state.wallet);
    const isDebug = useSelector(selectIsDebugModeActive);

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
                // TODO: remove isDebug for staking release
                if (isDebug) {
                    return <EthStakingDashboard selectedAccount={selectedAccount} />;
                }
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
