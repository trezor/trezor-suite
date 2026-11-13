import { useEffect } from 'react';

import {
    fetchAllTransactionsForAccountThunk,
    getTronStakingRewards,
    selectAccountIsStakingActive,
} from '@suite-common/wallet-core';
import { type SelectedAccountLoaded } from '@suite-common/wallet-types';
import { Column } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { useNow } from '@trezor/react-utils';
import { injectDispatch } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

import { useSelector } from '#src/hooks/suite';

import { TronResourcesCard } from './TronResourcesCard/TronResourcesCard';
import { TronStakedCard } from './TronStakedCard';
import { TronUnstakingCard } from './TronUnstakingCard/TronUnstakingCard';
import { TronVotingRewardsCard } from './TronVotingRewardsCard';
import { TronWithdrawReadyBanner } from './TronWithdrawReadyBanner';
import { StakingDashboard } from '../StakingDashboard/StakingDashboard';
import { EmptyStakingCard } from '../StakingDashboard/components/EmptyStakingCard/EmptyStakingCard';
import { Transactions } from '../StakingDashboard/components/Transactions';

const UNSTAKING_REFRESH_INTERVAL_MS = 60 * 1000;

interface TronStakingDashboardProps {
    selectedAccount: SelectedAccountLoaded;
}

export const TronStakingDashboard = ({ selectedAccount }: TronStakingDashboardProps) => {
    const { account } = selectedAccount;
    const { dispatch } = useServices(injectDispatch);
    const accountKey = account.key;

    const isStakingActive = useSelector(state => selectAccountIsStakingActive(state, accountKey));

    const hasUnclaimedRewards = new BigNumber(getTronStakingRewards(account)).gt(0);

    const nowSeconds = useNow(UNSTAKING_REFRESH_INTERVAL_MS) / 1000;

    useEffect(() => {
        dispatch(fetchAllTransactionsForAccountThunk({ accountKey, noLoading: true }));
    }, [accountKey, dispatch]);

    return (
        <StakingDashboard
            selectedAccount={selectedAccount}
            dashboard={
                <Column gap={48} alignItems="stretch">
                    {isStakingActive || hasUnclaimedRewards ? (
                        <Column
                            gap={12}
                            alignItems="stretch"
                            width="100%"
                            maxWidth={560}
                            margin={{ horizontal: 'auto' }}
                        >
                            <TronWithdrawReadyBanner account={account} nowSeconds={nowSeconds} />
                            <TronVotingRewardsCard account={account} />
                            <TronUnstakingCard account={account} nowSeconds={nowSeconds} />
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
