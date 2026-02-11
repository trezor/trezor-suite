import { useEffect, useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { commonQueryKeys } from '@suite-common/react-query';
import { getDaysToAddToPool, getDaysToUnstake } from '@suite-common/staking';
import {
    fetchAllTransactionsForAccountThunk,
    fetchEverstakeDataApi,
    selectAccountIsStakingActive,
    selectAccountStakeTransactions,
    selectAccountUnstakeTransactions,
    selectHasRunningDiscovery,
    selectPoolStatsApyData,
    selectPoolStatsNextRewardPayout,
} from '@suite-common/wallet-core';
import { EverstakeEndpointType, SelectedAccountLoaded } from '@suite-common/wallet-types';
import {
    getStakingDataForNetwork,
    hasStakeInPendingDepositedState,
} from '@suite-common/wallet-utils';
import { Column, Flex, Grid } from '@trezor/components';

import { DashboardSection } from 'src/components/dashboard';
import { useDispatch, useLayoutSize, useSelector } from 'src/hooks/suite';

import { InstantStakeBanner } from './InstantStakeBanner';
import { StakingDashboard } from '../StakingDashboard/StakingDashboard';
import { ApyCard } from '../StakingDashboard/components/ApyCard';
import { ClaimCard } from '../StakingDashboard/components/ClaimCard';
import { DiscoveryWarning } from '../StakingDashboard/components/DiscoveryWarning';
import { EmptyStakingCard } from '../StakingDashboard/components/EmptyStakingCard';
import { PayoutCardNextRewards } from '../StakingDashboard/components/PayoutCardNextRewards';
import { StakingCard } from '../StakingDashboard/components/StakingCard';
import { Transactions } from '../StakingDashboard/components/Transactions';

interface EthStakingDashboardProps {
    selectedAccount: SelectedAccountLoaded;
}

export const EthStakingDashboard = ({ selectedAccount }: EthStakingDashboardProps) => {
    const { account } = selectedAccount;

    const accountKey = account?.key ?? '';
    const { isBelowLaptop } = useLayoutSize();
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const apy = useSelector(state => selectPoolStatsApyData(state, account));
    const nextRewardPayout = useSelector(state =>
        selectPoolStatsNextRewardPayout(state, account?.symbol),
    );

    const stakeTxs = useSelector(state => selectAccountStakeTransactions(state, accountKey));
    const unstakeTxs = useSelector(state => selectAccountUnstakeTransactions(state, accountKey));

    const dispatch = useDispatch();

    const lastTxBlockTime = useMemo(() => {
        if (!stakeTxs?.length) return undefined;

        return stakeTxs[0]?.blockTime;
    }, [stakeTxs]);

    const { data: validatorQueueData, isLoading: isValidatorQueueLoading } = useQuery({
        enabled: !!account,
        queryKey: commonQueryKeys.validatorsQueue(accountKey, lastTxBlockTime),
        staleTime: 60 * 1000, // 1 minute
        queryFn: () => {
            if (!account) return;

            const timestamp = hasStakeInPendingDepositedState(account)
                ? lastTxBlockTime
                : undefined;

            return fetchEverstakeDataApi({
                symbol: 'eth',
                endpointType: EverstakeEndpointType.ValidatorsQueue,
                timestamp,
            });
        },
    });

    useEffect(() => {
        if (accountKey) {
            dispatch(
                fetchAllTransactionsForAccountThunk({
                    accountKey,
                    noLoading: true,
                }),
            );
        }
    }, [accountKey, dispatch]);

    const txs = useMemo(() => [...stakeTxs, ...unstakeTxs], [stakeTxs, unstakeTxs]);

    const daysToAddToPool = getDaysToAddToPool(stakeTxs, validatorQueueData);
    const daysToUnstake = getDaysToUnstake(unstakeTxs, validatorQueueData);

    const { canClaim = false } = getStakingDataForNetwork(account) ?? {};

    const isStakingActive = useSelector(state => selectAccountIsStakingActive(state, account.key));

    return (
        <StakingDashboard
            selectedAccount={selectedAccount}
            dashboard={
                <Column gap={48}>
                    {isStakingActive ? (
                        <DashboardSection>
                            <Column gap={12}>
                                {isDiscoveryRunning && <DiscoveryWarning />}

                                <InstantStakeBanner
                                    txs={txs}
                                    daysToAddToPool={daysToAddToPool}
                                    daysToUnstake={daysToUnstake}
                                />
                                <Grid columns={isBelowLaptop || !canClaim ? 1 : 2} gap={12}>
                                    <ClaimCard />
                                    <Flex direction={canClaim ? 'column' : 'row'} gap={12}>
                                        <ApyCard apy={apy} />
                                        <PayoutCardNextRewards
                                            nextRewardPayout={nextRewardPayout}
                                            daysToAddToPool={daysToAddToPool}
                                            validatorWithdrawTime={
                                                validatorQueueData?.validatorWithdrawTime
                                            }
                                        />
                                    </Flex>
                                </Grid>
                                <StakingCard
                                    account={account}
                                    isValidatorsQueueLoading={isValidatorQueueLoading}
                                    daysToAddToPool={daysToAddToPool}
                                    daysToUnstake={daysToUnstake}
                                />
                            </Column>
                        </DashboardSection>
                    ) : (
                        <EmptyStakingCard />
                    )}

                    <Transactions />
                </Column>
            }
        />
    );
};
