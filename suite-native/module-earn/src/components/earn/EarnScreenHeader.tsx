import { useSelector } from 'react-redux';

import {
    type StakingDeviceRootState,
    selectDeviceStakingEntryByWarning,
    selectDeviceStakingPositionEntries,
} from '@suite-common/earn-staking';
import {
    type EarnListRootState,
    selectYieldClaimListItems,
    selectYieldListItems,
    useYieldClaimRewardsWithFiat,
    useYieldOpportunities,
} from '@suite-common/wallet-core';
import { VStack } from '@suite-native/atoms';
import { returnStableArrayIfEmpty } from '@trezor/redux-utils';

import { EarnBalanceCard } from './EarnBalanceCard';
import { useMessageSystemEarnDashboard } from '../../hooks/earn/useMessageSystemEarnDashboard';
import { useReportEarnDashboardReadyEvent } from '../../hooks/earn/useReportEarnDashboardReadyEvent';
import { CardanoStakingInfoBanner } from '../staking/CardanoStakingInfoBanner';
import { StakingPositionsCard } from '../staking/StakingPositionsCard';
import { YieldPositionsCard } from '../yield/YieldPositionsCard';

const EMPTY_ARRAY = returnStableArrayIfEmpty<never>([]);

export const EarnScreenHeader = () => {
    const { isDisabled: isStakingDisabled } = useMessageSystemEarnDashboard('staking');
    const { isDisabled: isYieldDisabled } = useMessageSystemEarnDashboard('yield');

    const {
        yieldOpportunities,
        isLoading: isYieldOpportunitiesLoading,
        isError: isYieldOpportunitiesError,
    } = useYieldOpportunities();

    const stakingPositionEntries = useSelector((state: StakingDeviceRootState) =>
        isStakingDisabled ? EMPTY_ARRAY : selectDeviceStakingPositionEntries(state),
    );

    const yieldPositions = useSelector((state: EarnListRootState) =>
        !isYieldDisabled ? selectYieldListItems(state, yieldOpportunities) : EMPTY_ARRAY,
    );

    const { claimRewardsWithFiat, isClaimLoading, isClaimError } = useYieldClaimRewardsWithFiat();

    const claimItems = useSelector((state: EarnListRootState) =>
        selectYieldClaimListItems(state, claimRewardsWithFiat),
    );

    const outdatedProviderAccountKey = useSelector((state: StakingDeviceRootState) =>
        isStakingDisabled
            ? null
            : (selectDeviceStakingEntryByWarning(state, 'outdated-provider')?.accountKey ?? null),
    );

    const hasEarnPositions = stakingPositionEntries.length > 0 || yieldPositions.length > 0;
    const hasClaimItems = claimItems.length > 0;

    useReportEarnDashboardReadyEvent({
        yieldOpportunities,
        isLoading: !isYieldDisabled && (isYieldOpportunitiesLoading || isClaimLoading),
        isError: !isYieldDisabled && (isYieldOpportunitiesError || isClaimError),
        yieldPositionsCount: yieldPositions.length,
        stakingPositionsCount: stakingPositionEntries.length,
        claimItemsCount: isYieldDisabled ? 0 : claimItems.length,
        isStakingDisabled,
        isYieldDisabled,
    });

    if (!hasEarnPositions && !hasClaimItems) return null;

    return (
        <VStack spacing="sp24">
            {outdatedProviderAccountKey !== null && (
                <CardanoStakingInfoBanner accountKey={outdatedProviderAccountKey} />
            )}

            <VStack spacing="sp12">
                <EarnBalanceCard />
                <StakingPositionsCard />
                <YieldPositionsCard />
            </VStack>
        </VStack>
    );
};
