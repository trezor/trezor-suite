import { WalletLayout } from 'src/components/wallet';
import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { EmptyStakingCard } from './components/EmptyStakingCard';

interface EthStakingDashboardProps {
    selectedAccount: SelectedAccountLoaded;
}

export const EthStakingDashboard = ({ selectedAccount }: EthStakingDashboardProps) => {
    // TODO: Replace with real data
    const isAccountStaked = false;

    return (
        <WalletLayout title="TR_STAKE_ETH" account={selectedAccount}>
            {isAccountStaked ? 'Ethereum staking' : <EmptyStakingCard />}
        </WalletLayout>
    );
};
