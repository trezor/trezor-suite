import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type SelectedAccountStatus } from '@suite-common/wallet-types';

import { WalletLayout } from 'src/components/wallet';

import { EverstakeFooter } from './components/EverstakeFooter';

interface StakingDashboardProps {
    selectedAccount: SelectedAccountStatus;
    dashboard: React.ReactElement;
}

export const StakingDashboard = ({ selectedAccount, dashboard }: StakingDashboardProps) => {
    if (selectedAccount.status !== 'loaded') return null;

    return (
        <WalletLayout
            title="TR_EARN_STAKE_TOKEN"
            titleValues={{ symbol: getNetworkDisplaySymbol(selectedAccount.account.symbol) }}
            account={selectedAccount}
        >
            {dashboard}
            <EverstakeFooter />
        </WalletLayout>
    );
};
