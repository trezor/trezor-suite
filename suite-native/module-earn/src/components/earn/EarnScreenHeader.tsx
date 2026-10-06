import { useSelector } from 'react-redux';

import { type DeviceRootState } from '@suite-common/device';
import { type NetworksRootState } from '@suite-common/networks';
import { returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { VStack } from '@suite-native/atoms';

import { EarnBalanceCard } from './EarnBalanceCard';
import {
    type EarnListRootState,
    selectCardanoStakedWithFiveBinariesAccountKey,
    selectStakingListItems,
    selectYieldClaimListItems,
    selectYieldListItems,
} from '../../earnScreenSelectors';
import { useMessageSystemEarnDashboard } from '../../hooks/earn/useMessageSystemEarnDashboard';
import { useClaimRewardsWithFiat } from '../../hooks/yield/useClaimRewardsWithFiat';
import { useYieldOpportunities } from '../../hooks/yield/useYieldOpportunities';
import { CardanoStakingInfoBanner } from '../staking/CardanoStakingInfoBanner';
import { StakingPositionsCard } from '../staking/StakingPositionsCard';
import { YieldPositionsCard } from '../yield/YieldPositionsCard';

const EMPTY_ARRAY = returnStableArrayIfEmpty<never>([]);

export const EarnScreenHeader = () => {
    const { isDisabled: isStakingDisabled } = useMessageSystemEarnDashboard('staking');
    const { isDisabled: isYieldDisabled } = useMessageSystemEarnDashboard('yield');

    const { yieldOpportunities } = useYieldOpportunities();

    const stakingPositions = useSelector((state: EarnListRootState) =>
        !isStakingDisabled ? selectStakingListItems(state) : EMPTY_ARRAY,
    );

    const yieldPositions = useSelector((state: EarnListRootState) =>
        !isYieldDisabled ? selectYieldListItems(state, yieldOpportunities) : EMPTY_ARRAY,
    );

    const { claimRewardsWithFiat } = useClaimRewardsWithFiat();

    const claimItems = useSelector((state: EarnListRootState) =>
        selectYieldClaimListItems(state, claimRewardsWithFiat),
    );

    const cardanoStakedWithFiveBinariesAccountKey = useSelector(
        (state: AccountsRootState & DeviceRootState & NetworksRootState) =>
            !isStakingDisabled ? selectCardanoStakedWithFiveBinariesAccountKey(state) : null,
    );

    const hasEarnPositions = stakingPositions.length > 0 || yieldPositions.length > 0;
    const hasClaimItems = claimItems.length > 0;

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
