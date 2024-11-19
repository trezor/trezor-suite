import { selectAccountHasStaked } from '@suite-common/wallet-core';
import { SelectedAccountStatus } from '@suite-common/wallet-types';

import { WalletLayout } from 'src/components/wallet';
import { useSelector } from 'src/hooks/suite';

import { EmptyStakingCard } from './components/EmptyStakingCard';
import { EverstakeFooter } from './components/EverstakeFooter';

interface StakingDashboardProps {
    selectedAccount: SelectedAccountStatus;
    dashboard: React.ReactElement;
}

export const StakingDashboard = ({ selectedAccount, dashboard }: StakingDashboardProps) => {
    const hasStaked = useSelector(state =>
        selectAccountHasStaked(state, selectedAccount?.account?.key ?? ''),
    );

    if (!selectedAccount) return null;

    return (
        <WalletLayout
            title="TR_STAKE_NETWORK"
            titleValues={{ symbol: selectedAccount?.account?.symbol.toUpperCase() }}
            account={selectedAccount}
        >
            {hasStaked ? dashboard : <EmptyStakingCard />}

            <EverstakeFooter />
        </WalletLayout>
    );
};
