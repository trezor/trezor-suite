import { useEffect, useMemo } from 'react';

import { getDaysToAddToPool, getDaysToUnstake } from '@suite-common/staking';
import {
    fetchAllTransactionsForAccountThunk,
    selectAccountIsStakingActive,
    selectAccountStakeTransactions,
    selectAccountUnstakeTransactions,
    selectHasRunningDiscovery,
    selectPoolStatsApyData,
    selectPoolStatsNextRewardPayout,
    selectValidatorsQueue,
} from '@suite-common/wallet-core';
import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import { getStakingDataForNetwork } from '@suite-common/wallet-utils';
import { Column, Flex, Grid } from '@trezor/components';
import { spacings } from '@trezor/theme';

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

    const { data, isLoading } =
        useSelector(state => selectValidatorsQueue(state, account?.symbol)) || {};

    const apy = useSelector(state => selectPoolStatsApyData(state, account));
    const nextRewardPayout = useSelector(state =>
        selectPoolStatsNextRewardPayout(state, account?.symbol),
    );

    const stakeTxs = useSelector(state => selectAccountStakeTransactions(state, accountKey));
    const unstakeTxs = useSelector(state => selectAccountUnstakeTransactions(state, accountKey));

    const dispatch = useDispatch();

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

    const daysToAddToPool = getDaysToAddToPool(stakeTxs, data);
    const daysToUnstake = getDaysToUnstake(unstakeTxs, data);

    const { canClaim = false } = getStakingDataForNetwork(account) ?? {};

    const isStakingActive = useSelector(state => selectAccountIsStakingActive(state, account.key));

    return (
        <StakingDashboard
            selectedAccount={selectedAccount}
            dashboard={
                <Column gap={spacings.xxxxl}>
                    {isStakingActive ? (
                        <DashboardSection>
                            <Column gap={spacings.sm}>
                                {isDiscoveryRunning && <DiscoveryWarning />}

                                <InstantStakeBanner
                                    txs={txs}
                                    daysToAddToPool={daysToAddToPool}
                                    daysToUnstake={daysToUnstake}
                                />
                                <Grid
                                    columns={isBelowLaptop || !canClaim ? 1 : 2}
                                    gap={spacings.sm}
                                >
                                    <ClaimCard />
                                    <Flex direction={canClaim ? 'column' : 'row'} gap={spacings.sm}>
                                        <ApyCard apy={apy} />
                                        <PayoutCardNextRewards
                                            nextRewardPayout={nextRewardPayout}
                                            daysToAddToPool={daysToAddToPool}
                                            validatorWithdrawTime={data?.validatorWithdrawTime}
                                        />
                                    </Flex>
                                </Grid>
                                <StakingCard
                                    account={account}
                                    isValidatorsQueueLoading={isLoading}
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
