import { selectAccountStakeTransactions } from '@suite-common/wallet-core';
import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { WalletLayout } from 'src/components/wallet';
import { useSelector } from 'src/hooks/suite';
import { EmptyStakingCard } from './components/EmptyStakingCard';
import { StakingDashboard } from './components/StakingDashboard';

interface EthStakingDashboardProps {
    selectedAccount: SelectedAccountLoaded;
}

export const EthStakingDashboard = ({ selectedAccount }: EthStakingDashboardProps) => {
    const stakeTxs = useSelector(state =>
        selectAccountStakeTransactions(state, selectedAccount.account?.key || ''),
    );
    const hasStaked = stakeTxs.length > 0;

    return (
        <WalletLayout title="TR_STAKE_ETH" account={selectedAccount}>
            {hasStaked ? <StakingDashboard /> : <EmptyStakingCard />}
        </WalletLayout>
    );
};
