import { useEffect } from 'react';

import {
    useSolStakingRewardsWarning,
    useSolanaRewardsHistory,
} from '@suite-common/earn-staking-api/src/staking';
import { useSelector } from '@suite-common/redux-utils';
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
import { SOLANA_EPOCH_DAYS } from '@trezor/network-solana/constants';
import { useCurrentRef } from '@trezor/react-utils';

import { DashboardSection } from 'src/components/dashboard';
import { usePagination } from 'src/hooks/general/usePagination';
import { useLayoutSize } from 'src/hooks/suite';

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

    const hasExternalStakingAccounts = useSelector(state =>
        selectHasSolExternalStakingAccounts(state, account.key),
    );
    const externalStakingTotalStaked = useSelector(state =>
        selectSolExternalStakingAccountsTotalStaked(state, account.key),
    );

    const externalStakingProviderCard = hasExternalStakingAccounts ? (
        <ExternalStakingProviderCard
            symbol={account.symbol}
            totalStaked={externalStakingTotalStaked}
        />
    ) : null;

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
                                        <ClaimCard />
                                        <Flex direction={canClaim ? 'column' : 'row'} gap={12}>
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
                        <Column alignItems="normal" gap={12}>
                            {externalStakingProviderCard}
                            <EmptyStakingCard />
                        </Column>
                    )}
                </Column>
            }
        />
    );
};
