import { useEffect } from 'react';

import {
    selectIsStakingAccountActive,
    selectStakingPositionEntriesByAccount,
    useNetworkStakingRate,
    useStakingAccountPosition,
    useStakingDaysUntil,
    useStakingPeriods,
} from '@suite-common/earn-staking';
import {
    useSolStakingRewardsWarning,
    useSolanaRewardsHistory,
} from '@suite-common/earn-staking-api/src/staking';
import { getStakingPositionAmount } from '@suite-common/earn-staking-common';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { type SelectedAccountLoaded } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { Column, Flex, Grid } from '@trezor/components';
import { useCurrentRef } from '@trezor/react-utils';

import { DashboardSection } from '#src/components/dashboard/DashboardSection';
import { usePagination } from '#src/hooks/general/usePagination';
import { useLayoutSize } from '#src/hooks/suite/useLayoutSize';
import { useSelector } from '#src/hooks/suite/useSelector';

import { StakingDashboard } from '../StakingDashboard/StakingDashboard';
import { RewardsList } from './Rewards/RewardsList';
import { StakingRewardsWarning } from './StakingRewardsWarning';
import { ApyCard } from '../StakingDashboard/components/ApyCard';
import { ClaimCard } from '../StakingDashboard/components/ClaimCard';
import { DiscoveryWarning } from '../StakingDashboard/components/DiscoveryWarning';
import { EmptyStakingCard } from '../StakingDashboard/components/EmptyStakingCard/EmptyStakingCard';
import { ExternalStakingProviderCard } from '../StakingDashboard/components/ExternalStakingProviderCard';
import { PayoutCardFrequencyRewards } from '../StakingDashboard/components/PayoutCardFrequencyRewards';
import { StakingCard } from '../StakingDashboard/components/StakingCard';

interface SolStakingDashboardProps {
    selectedAccount: SelectedAccountLoaded;
}

export const SolStakingDashboard = ({ selectedAccount }: SolStakingDashboardProps) => {
    const { account } = selectedAccount;
    const accountKey = account.key;

    const { isBelowLaptop } = useLayoutSize();
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const { productId, position, totals } = useStakingAccountPosition(accountKey);
    const { rate } = useNetworkStakingRate({ networkSymbol: account.symbol, accountKey });
    const { entryPeriodDays, exitPeriodDays, rewardPeriodDays } = useStakingPeriods(productId);

    const daysUntilActivation = useStakingDaysUntil(position?.activations[0]?.availableAt ?? null);
    const daysUntilUnlock = useStakingDaysUntil(position?.unlocks[0]?.availableAt ?? null);
    const daysToAddToPool = daysUntilActivation ?? entryPeriodDays;
    const daysToUnstake = daysUntilUnlock ?? exitPeriodDays;

    const canClaim = isPositiveBalance(totals.withdrawable);

    const isStakingActive = useSelector(state => selectIsStakingAccountActive(state, accountKey));

    const initialPage = 1;
    const pagination = usePagination({ pageSize: 10, initialPage });
    const rewardsQueryResult = useSolanaRewardsHistory(account, {
        limit: pagination.pageSize,
        offset: pagination.offset,
    });

    const { shouldShowWarning } = useSolStakingRewardsWarning(account, {
        limit: pagination.pageSize,
    });

    const { setTotalCount } = pagination;
    const rewardsTotalCount = rewardsQueryResult.data?.totalCount;

    useEffect(() => {
        if (rewardsTotalCount !== undefined) {
            setTotalCount(rewardsTotalCount);
        }
    }, [rewardsTotalCount, setTotalCount]);

    const pagintionRef = useCurrentRef(pagination);

    useEffect(() => {
        // reset solana rewards page on account change
        pagintionRef.current.changePage(initialPage);
    }, [account.descriptor, account.symbol, initialPage, pagintionRef]);

    // Stake with other validators is the account's position that counts in no total.
    const externalPositionEntry = useSelector(
        state =>
            selectStakingPositionEntriesByAccount(state, accountKey).find(
                ({ descriptor }) => !descriptor.isCountedInAccountTotals,
            ) ?? null,
    );

    const externalStakingProviderCard =
        externalPositionEntry === null ? null : (
            <ExternalStakingProviderCard
                symbol={account.symbol}
                totalStaked={getStakingPositionAmount(externalPositionEntry.position)}
            />
        );

    return (
        <StakingDashboard
            selectedAccount={selectedAccount}
            dashboard={
                <Column alignItems="normal" gap={48}>
                    {isStakingActive ? (
                        <>
                            <DashboardSection>
                                <Column alignItems="normal" gap={12}>
                                    {externalStakingProviderCard}
                                    {isDiscoveryRunning && <DiscoveryWarning />}
                                    {shouldShowWarning && <StakingRewardsWarning />}

                                    <Grid columns={isBelowLaptop || !canClaim ? 1 : 2} gap={12}>
                                        <ClaimCard account={account} />

                                        <Flex direction={canClaim ? 'column' : 'row'} gap={12}>
                                            <ApyCard apy={rate} />

                                            <PayoutCardFrequencyRewards
                                                rewardFrequency={rewardPeriodDays}
                                            />
                                        </Flex>
                                    </Grid>

                                    <StakingCard
                                        account={account}
                                        daysToAddToPool={daysToAddToPool}
                                        daysToUnstake={daysToUnstake}
                                    />
                                </Column>
                            </DashboardSection>

                            <RewardsList
                                account={account}
                                rewardsQueryResult={rewardsQueryResult}
                                pagination={pagination}
                            />
                        </>
                    ) : (
                        <Column alignItems="normal" gap={12}>
                            {externalStakingProviderCard}
                            <EmptyStakingCard account={account} />
                        </Column>
                    )}
                </Column>
            }
        />
    );
};
