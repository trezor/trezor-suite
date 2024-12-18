import { selectAccountHasStaked, selectSolStakingAccounts } from '@suite-common/wallet-core';
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
    const hasStaked = useSelector(state =>
        selectAccountHasStaked(state, selectedAccount?.account?.key ?? ''),
    );

    const { account } = selectedAccount;

    const solStakingAccounts = useSelector(state => selectSolStakingAccounts(state, account?.key));

    const hasSolStakingAccount = !!solStakingAccounts?.length;
    const shouldShowDashboard = hasStaked || hasSolStakingAccount;

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
