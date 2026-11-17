import { type SelectedAccountStatus } from '@suite-common/wallet-types';

import { WalletLayout } from '#src/components/wallet/WalletLayout/WalletLayout';
import { useNetworkDisplaySymbolText } from '#src/hooks/wallet/useNetworkDisplaySymbolText';

import { StakingFooter } from './components/StakingFooter';

interface StakingDashboardProps {
    selectedAccount: SelectedAccountStatus;
    dashboard: React.ReactElement;
}

export const StakingDashboard = ({ selectedAccount, dashboard }: StakingDashboardProps) => {
    const networkDisplaySymbol = useNetworkDisplaySymbolText(selectedAccount.account?.symbol);

    if (selectedAccount.status !== 'loaded') return null;

    return (
        <WalletLayout
            title="TR_EARN_STAKE_TOKEN"
            titleValues={{ symbol: networkDisplaySymbol }}
            account={selectedAccount}
        >
            {dashboard}
            <StakingFooter networkType={selectedAccount.account.networkType} />
        </WalletLayout>
    );
};
