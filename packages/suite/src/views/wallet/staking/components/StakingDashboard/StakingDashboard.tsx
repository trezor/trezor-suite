import { selectEthAccountHasStaked, selectSolAccountHasStaked } from '@suite-common/wallet-core';
import { SelectedAccountStatus } from '@suite-common/wallet-types';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';

import { WalletLayout } from 'src/components/wallet';
import { useSelector } from 'src/hooks/suite';

import { EmptyStakingCard } from './components/EmptyStakingCard';
import { EverstakeFooter } from './components/EverstakeFooter';

interface StakingDashboardProps {
    selectedAccount: SelectedAccountStatus;
    dashboard: React.ReactElement;
}

export const StakingDashboard = ({ selectedAccount, dashboard }: StakingDashboardProps) => {
    const hasEthStaked = useSelector(state =>
        selectEthAccountHasStaked(state, selectedAccount.account?.key ?? ''),
    );
    const hasSolStaked = useSelector(state =>
        selectSolAccountHasStaked(state, selectedAccount.account?.key),
    );

    if (selectedAccount.status !== 'loaded') return null;

    const shouldShowDashboard = hasEthStaked || hasSolStaked;

    return (
        <WalletLayout
            title="TR_STAKE_NETWORK"
            titleValues={{ symbol: getNetworkDisplaySymbol(selectedAccount.account.symbol) }}
            account={selectedAccount}
        >
            {shouldShowDashboard ? dashboard : <EmptyStakingCard />}
            <EverstakeFooter />
        </WalletLayout>
    );
};
