import { useServices } from '@suite-common/dependency-injection';
import { getNetworkDisplaySymbol , selectNetworkConfigDeps } from '@suite-common/wallet-config';
import { type SelectedAccountStatus } from '@suite-common/wallet-types';

import { WalletLayout } from 'src/components/wallet';

import { EverstakeFooter } from './components/EverstakeFooter';

interface StakingDashboardProps {
    selectedAccount: SelectedAccountStatus;
    dashboard: React.ReactElement;
}

export const StakingDashboard = ({ selectedAccount, dashboard }: StakingDashboardProps) => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);
    if (selectedAccount.status !== 'loaded') return null;

    return (
        <WalletLayout
            title="TR_EARN_STAKE_TOKEN"
            titleValues={{
                symbol: getNetworkDisplaySymbol(networkConfigDeps, selectedAccount.account.symbol),
            }}
            account={selectedAccount}
        >
            {dashboard}
            <EverstakeFooter />
        </WalletLayout>
    );
};
