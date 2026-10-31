import { useSelector } from 'react-redux';

import { type DeviceRootState } from '@suite-common/device';
import { type NetworksRootState } from '@suite-common/networks';
import {
    type AccountsRootState,
    type EarnListRootState,
    selectCardanoStakedWithFiveBinariesAccountKey,
    selectStakingListItems,
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

    const stakingPositions = useSelector((state: EarnListRootState) =>
        !isStakingDisabled ? selectStakingListItems(state) : EMPTY_ARRAY,
    );

    const yieldPositions = useSelector((state: EarnListRootState) =>
        !isYieldDisabled ? selectYieldListItems(state, yieldOpportunities) : EMPTY_ARRAY,
    );

    const { claimRewardsWithFiat, isClaimLoading, isClaimError } = useYieldClaimRewardsWithFiat();

    const claimItems = useSelector((state: EarnListRootState) =>
        selectYieldClaimListItems(state, claimRewardsWithFiat),
    );

    const cardanoStakedWithFiveBinariesAccountKey = useSelector(
        (state: AccountsRootState & DeviceRootState & NetworksRootState) =>
            !isStakingDisabled ? selectCardanoStakedWithFiveBinariesAccountKey(state) : null,
    );

    const hasEarnPositions = stakingPositions.length > 0 || yieldPositions.length > 0;
    const hasClaimItems = claimItems.length > 0;

    useReportEarnDashboardReadyEvent({
        yieldOpportunities,
        isLoading: !isYieldDisabled && (isYieldOpportunitiesLoading || isClaimLoading),
        isError: !isYieldDisabled && (isYieldOpportunitiesError || isClaimError),
        yieldPositionsCount: yieldPositions.length,
        stakingPositionsCount: stakingPositions.length,
        claimItemsCount: isYieldDisabled ? 0 : claimItems.length,
        isStakingDisabled,
        isYieldDisabled,
    });

    if (!hasEarnPositions && !hasClaimItems) return null;

    return (
        <VStack spacing="sp24">
            {cardanoStakedWithFiveBinariesAccountKey !== null && (
                <CardanoStakingInfoBanner accountKey={cardanoStakedWithFiveBinariesAccountKey} />
            )}

            <VStack spacing="sp12">
                <EarnBalanceCard />
                <StakingPositionsCard />
                <YieldPositionsCard />
            </VStack>
        </VStack>
    );
};
