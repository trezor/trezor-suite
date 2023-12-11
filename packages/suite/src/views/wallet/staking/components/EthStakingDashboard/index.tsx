import { WalletLayout } from 'src/components/wallet';
import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { EmptyStakingCard } from './components/EmptyStakingCard';
import { StakingDashboard } from './components/StakingDashboard';
import { STAKED_ETH_WITH_REWARDS } from 'src/constants/suite/ethStaking';

interface EthStakingDashboardProps {
    selectedAccount: SelectedAccountLoaded;
}

export const EthStakingDashboard = ({ selectedAccount }: EthStakingDashboardProps) => {
    // TODO: Replace with real data
    const hasStaked = STAKED_ETH_WITH_REWARDS.gt(0);

    return (
        <WalletLayout title="TR_STAKE_ETH" account={selectedAccount}>
            {hasStaked ? <StakingDashboard /> : <EmptyStakingCard />}
        </WalletLayout>
    );
};
