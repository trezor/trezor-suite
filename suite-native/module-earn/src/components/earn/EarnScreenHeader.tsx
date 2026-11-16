import { useSelector } from 'react-redux';

import {
    type StakingDeviceRootState,
    selectDeviceStakingEntryByWarning,
    selectDeviceStakingPositionEntries,
} from '@suite-common/earn-staking';
import { getStakingPositionAmount } from '@suite-common/earn-staking-common';
import {
    type EarnListRootState,
    selectYieldClaimListItems,
    selectYieldListItems,
    useYieldClaimRewardsWithFiat,
    useYieldOpportunities,
} from '@suite-common/wallet-core';
import { VStack } from '@suite-native/atoms';
import { returnStableArrayIfEmpty } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

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

    // The banner needs a funded account, as the home banner does.
    const outdatedProviderAccountKey = useSelector((state: StakingDeviceRootState) => {
        if (isStakingDisabled) return null;

        const position = selectDeviceStakingEntryByWarning(state, 'outdated-provider');

        if (position === null) return null;
        if (new BigNumber(getStakingPositionAmount(position.position)).lte(0)) return null;

        return position.accountKey;
    });

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
