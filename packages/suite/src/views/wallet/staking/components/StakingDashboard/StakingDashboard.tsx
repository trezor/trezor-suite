import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type SelectedAccountStatus } from '@suite-common/wallet-types';

import { StakingFooter } from './components/StakingFooter';
import { WalletLayout } from '../../../../../components/wallet';

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
            <StakingFooter networkType={selectedAccount.account.networkType} />
        </WalletLayout>
    );
};
