import { selectAccountHasStaked } from '@suite-common/wallet-core';
import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { WalletLayout } from 'src/components/wallet';
import { useSelector } from 'src/hooks/suite';
import { EmptyStakingCard } from './components/EmptyStakingCard';
import { StakingDashboard } from './components/StakingDashboard';
import { EverstakeFooter } from './components/EverstakeFooter';

interface EthStakingDashboardProps {
    selectedAccount: SelectedAccountLoaded;
}

export const EthStakingDashboard = ({ selectedAccount }: EthStakingDashboardProps) => {
    const hasStaked = useSelector(state => selectAccountHasStaked(state, selectedAccount.account));

    return (
        <WalletLayout title="TR_STAKE_ETH" account={selectedAccount}>
            {hasStaked ? <StakingDashboard /> : <EmptyStakingCard />}

            <EverstakeFooter />
        </WalletLayout>
    );
};
