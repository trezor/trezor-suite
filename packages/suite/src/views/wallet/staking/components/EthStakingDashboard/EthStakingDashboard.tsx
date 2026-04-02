import { useEffect, useMemo } from 'react';

import { useEthereumValidatorsQueue } from '@suite-common/earn-staking-api/src/staking';
import { getDaysToAddToPool, getDaysToUnstake } from '@suite-common/staking';
import {
    fetchAllTransactionsForAccountThunk,
    selectAccountIsStakingActive,
    selectAccountStakeTransactions,
    selectAccountUnstakeTransactions,
    selectEthNextRewardPayout,
    selectHasRunningDiscovery,
    selectPoolStatsApy,
} from '@suite-common/wallet-core';
import { type SelectedAccountLoaded } from '@suite-common/wallet-types';
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

    const apy = useSelector(state => selectPoolStatsApy(state, { account }));
    const nextRewardPayout = useSelector(selectEthNextRewardPayout);

    const stakeTxs = useSelector(state => selectAccountStakeTransactions(state, accountKey));
    const unstakeTxs = useSelector(state => selectAccountUnstakeTransactions(state, accountKey));

    const dispatch = useDispatch();

    const lastTxBlockTime = stakeTxs[0]?.blockTime;
    const timestamp = hasStakeInPendingDepositedState(account!) ? lastTxBlockTime : undefined;

    const { data: validatorQueueData, isLoading: isValidatorQueueLoading } =
        useEthereumValidatorsQueue({ account, timestamp });

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
                                            validatorWithdrawTime={validatorQueueData?.withdrawTime}
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
