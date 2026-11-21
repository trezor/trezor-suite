import { useEffect } from 'react';

import {
    TRON_UNLOCKS_REFRESH_INTERVAL_MS,
    selectIsStakingAccountActive,
} from '@suite-common/earn-staking';
import { fetchAllTransactionsForAccountThunk } from '@suite-common/wallet-core';
import { type SelectedAccountLoaded } from '@suite-common/wallet-types';
import { Column } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { useNow } from '@trezor/react-utils';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from '#src/hooks/suite/useSelector';

import { TronResourcesCard } from './TronResourcesCard/TronResourcesCard';
import { TronStakedCard } from './TronStakedCard';
import { TronUnstakingCard } from './TronUnstakingCard/TronUnstakingCard';
import { TronVotingRewardsCard } from './TronVotingRewardsCard';
import { TronWithdrawReadyBanner } from './TronWithdrawReadyBanner';
import { StakingDashboard } from '../StakingDashboard/StakingDashboard';
import { EmptyStakingCard } from '../StakingDashboard/components/EmptyStakingCard/EmptyStakingCard';
import { Transactions } from '../StakingDashboard/components/Transactions';

interface TronStakingDashboardProps {
    selectedAccount: SelectedAccountLoaded;
}

export const TronStakingDashboard = ({ selectedAccount }: TronStakingDashboardProps) => {
    const { account } = selectedAccount;
    const { dispatch } = useServices(injectDispatch);
    const accountKey = account.key;

    const isStakingActive = useSelector(state => selectIsStakingAccountActive(state, accountKey));

    // An unlock matures by time alone, so the cards settle the position at the current minute.
    const nowMs = useNow(TRON_UNLOCKS_REFRESH_INTERVAL_MS);

    useEffect(() => {
        dispatch(fetchAllTransactionsForAccountThunk({ accountKey, noLoading: true }));
    }, [accountKey, dispatch]);

    return (
        <StakingDashboard
            selectedAccount={selectedAccount}
            dashboard={
                <Column gap={48} alignItems="stretch">
                    {isStakingActive ? (
                        <Column
                            gap={12}
                            alignItems="stretch"
                            width="100%"
                            maxWidth={560}
                            margin={{ horizontal: 'auto' }}
                        >
                            <TronWithdrawReadyBanner account={account} nowMs={nowMs} />
                            <TronVotingRewardsCard account={account} />
                            <TronUnstakingCard account={account} nowMs={nowMs} />
                            <TronStakedCard account={account} />
                            <TronResourcesCard account={account} />
                        </Column>
                    ) : (
                        <EmptyStakingCard account={account} />
                    )}
                    <Transactions account={account} />
                </Column>
            }
        />
    );
};
