import { useEffect } from 'react';

import { withScope } from '@sentry/core';

import { EARN_API_BASE_URL } from '@suite-common/earn-staking-api/src/constants';
import { useSolanaRewardsHistory } from '@suite-common/earn-staking-api/src/staking';
import { SOLANA_EPOCH_DAYS } from '@suite-common/wallet-constants';
import {
    selectAccountIsStakingActive,
    selectHasRunningDiscovery,
    selectHasSolExternalStakingAccounts,
    selectPoolStatsApy,
    selectSolExternalStakingAccountsTotalStaked,
} from '@suite-common/wallet-core';
import { type SelectedAccountLoaded } from '@suite-common/wallet-types';
import { getStakingDataForNetwork } from '@suite-common/wallet-utils';
import { Column, Flex, Grid } from '@trezor/components';
import { useCurrentRef } from '@trezor/react-utils';
import { spacings } from '@trezor/theme';

import { DashboardSection } from 'src/components/dashboard';
import { usePagination } from 'src/hooks/general/usePagination';
import { useLayoutSize, useSelector } from 'src/hooks/suite';

import { StakingDashboard } from '../StakingDashboard/StakingDashboard';
import { RewardsList } from './Rewards/RewardsList';
import { StakingRewardsWarning } from './StakingRewardsWarning';
import { ApyCard } from '../StakingDashboard/components/ApyCard';
import { ClaimCard } from '../StakingDashboard/components/ClaimCard';
import { DiscoveryWarning } from '../StakingDashboard/components/DiscoveryWarning';
import { EmptyStakingCard } from '../StakingDashboard/components/EmptyStakingCard';
import { ExternalStakingProviderCard } from '../StakingDashboard/components/ExternalStakingProviderCard';
import { PayoutCardFrequencyRewards } from '../StakingDashboard/components/PayoutCardFrequencyRewards';
import { StakingCard } from '../StakingDashboard/components/StakingCard';
interface SolStakingDashboardProps {
    selectedAccount: SelectedAccountLoaded;
}

export const SolStakingDashboard = ({ selectedAccount }: SolStakingDashboardProps) => {
    const { account } = selectedAccount;

    const { isBelowLaptop } = useLayoutSize();
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const { canClaim = false } = getStakingDataForNetwork(account) ?? {};

    const apy = useSelector(state => selectPoolStatsApy(state, { account }));

    const isStakingActive = useSelector(state => selectAccountIsStakingActive(state, account.key));

    const initialPage = 1;
    const pagination = usePagination({ pageSize: 10, initialPage });
    const rewardsQueryResult = useSolanaRewardsHistory(account, {
        limit: pagination.pageSize,
        offset: pagination.offset,
        onTotalCount: pagination.setTotalCount,
        onOutOfSync() {
            withScope(scope => {
                scope.setTag('error.code', 'solana_rewards_history_out_of_sync');
                scope.setTag('error.source', EARN_API_BASE_URL);
                scope.setTag('error.network', account.networkType);
                scope.setTag('error.service', 'rewards_history');
                scope.captureException(
                    new Error(
                        'Solana rewards history is out of sync with the current active epoch. Everstake API might return stale data.',
                    ),
                );
            });
        },
    });

    const pagintionRef = useCurrentRef(pagination);

    useEffect(() => {
        // reset solana rewards page on account change
        pagintionRef.current.changePage(initialPage);
    }, [account.descriptor, account.symbol, initialPage, pagintionRef]);

    const hasExternalStakingAccounts = useSelector(state =>
        selectHasSolExternalStakingAccounts(state, account.key),
    );
    const externalStakingTotalStaked = useSelector(state =>
        selectSolExternalStakingAccountsTotalStaked(state, account.key),
    );

    return (
        <StakingDashboard
            selectedAccount={selectedAccount}
            dashboard={
                <Column alignItems="normal" gap={spacings.xxxxl}>
                    {hasExternalStakingAccounts && (
                        <ExternalStakingProviderCard
                            symbol={account.symbol}
                            totalStaked={externalStakingTotalStaked}
                        />
                    )}
                    {isStakingActive ? (
                        <>
                            <DashboardSection>
                                <Column alignItems="normal" gap={spacings.sm}>
                                    {isDiscoveryRunning && <DiscoveryWarning />}
                                    {rewardsQueryResult.isSuccess &&
                                        rewardsQueryResult.data.notAvailableYet && (
                                            <StakingRewardsWarning />
                                        )}

                                    <Grid
                                        columns={isBelowLaptop || !canClaim ? 1 : 2}
                                        gap={spacings.sm}
                                    >
                                        <ClaimCard />
                                        <Flex
                                            direction={canClaim ? 'column' : 'row'}
                                            gap={spacings.sm}
                                        >
                                            <ApyCard apy={apy} />
                                            <PayoutCardFrequencyRewards
                                                rewardFrequency={SOLANA_EPOCH_DAYS}
                                            />
                                        </Flex>
                                    </Grid>
                                    <StakingCard
                                        account={account}
                                        isValidatorsQueueLoading={undefined}
                                        daysToAddToPool={SOLANA_EPOCH_DAYS}
                                        daysToUnstake={SOLANA_EPOCH_DAYS}
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
                        <>
                            <EmptyStakingCard />
                        </>
                    )}
                </Column>
            }
        />
    );
};
