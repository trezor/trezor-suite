import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import { returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { injectNativeAnalytics } from '@suite-native/analytics';
import { VStack } from '@suite-native/atoms';

import { EarnBalanceCard } from './EarnBalanceCard';
import { selectCardanoStakedWithFiveBinariesAccountKey } from '../../earnListSelectors';
import { useMessageSystemEarnDashboard } from '../../hooks/earn/useMessageSystemEarnDashboard';
import { useStakingPositions } from '../../hooks/staking/useStakingPositions';
import { useYieldClaimSummary } from '../../hooks/yield/useYieldClaimSummary';
import { useYieldPositions } from '../../hooks/yield/useYieldPositions';
import { useYieldPromoList } from '../../hooks/yield/useYieldPromoList';
import { CardanoStakingInfoBanner } from '../staking/CardanoStakingInfoBanner';
import { StakingPositionsCard } from '../staking/StakingPositionsCard';
import { YieldPositionsCard } from '../yield/YieldPositionsCard';

const EMPTY_ARRAY = returnStableArrayIfEmpty<never>([]);

export const EarnScreenHeader = () => {
    const { analytics } = useServices(injectNativeAnalytics);

    const { isDisabled: isStakingDisabled } = useMessageSystemEarnDashboard('staking');
    const { isDisabled: isYieldDisabled } = useMessageSystemEarnDashboard('yield');

    const selectedCardanoStakedWithFiveBinariesAccountKey = useSelector(
        selectCardanoStakedWithFiveBinariesAccountKey,
    );
    const cardanoStakedWithFiveBinariesAccountKey = isStakingDisabled
        ? null
        : selectedCardanoStakedWithFiveBinariesAccountKey;

    const { data, isLoading: isYieldOpportunitiesLoading } = useAllYieldOpportunities();
    const yieldOpportunities = returnStableArrayIfEmpty(data);

    const { vaults: availableVaults } = useYieldPromoList();

    const selectedStakingPositions = useStakingPositions();
    const selectedYieldPositions = useYieldPositions({ yieldOpportunities });
    const selectedYieldClaim = useYieldClaimSummary({ yieldOpportunities });

    const isSelectedClaimItemsLoading =
        selectedYieldClaim.isClaimItemsLoading || isYieldOpportunitiesLoading;

    const hasReportedYieldDashboardReadyRef = useRef(false);

    useEffect(() => {
        if (hasReportedYieldDashboardReadyRef.current || isSelectedClaimItemsLoading) {
            return;
        }

        hasReportedYieldDashboardReadyRef.current = true;

        analytics.report({
            type: events.yieldEarnDashboardReadyEvent.name,
            payload: {
                hasClaimBanner: selectedYieldClaim.claimItems.length > 0,
                hasActivePosition: selectedYieldPositions.positions.length > 0,
                availableVaultCount: availableVaults.length,
            },
        });
    }, [
        analytics,
        availableVaults.length,
        isSelectedClaimItemsLoading,
        selectedYieldClaim.claimItems.length,
        selectedYieldPositions.positions.length,
    ]);

    const stakingPositions = isStakingDisabled
        ? { positions: EMPTY_ARRAY, symbols: EMPTY_ARRAY }
        : selectedStakingPositions;

    const yieldPositions = isYieldDisabled
        ? { positions: EMPTY_ARRAY, vaultIcons: EMPTY_ARRAY }
        : selectedYieldPositions;

    const yieldClaim = isYieldDisabled
        ? {
              ...selectedYieldClaim,
              claimItems: EMPTY_ARRAY,
              claimTokens: EMPTY_ARRAY,
              claimAccountItems: EMPTY_ARRAY,
              totalClaimableFiatAmount: null,
              isClaimItemsLoading: false,
          }
        : { ...selectedYieldClaim, isClaimItemsLoading: isSelectedClaimItemsLoading };

    const hasEarnPositions =
        stakingPositions.positions.length > 0 ||
        yieldPositions.positions.length > 0 ||
        yieldClaim.claimItems.length > 0;

    if (!hasEarnPositions) return null;

    return (
        <VStack spacing="sp24">
            {cardanoStakedWithFiveBinariesAccountKey !== null && (
                <CardanoStakingInfoBanner accountKey={cardanoStakedWithFiveBinariesAccountKey} />
            )}

            <VStack spacing="sp12">
                <EarnBalanceCard
                    stakingPositions={stakingPositions.positions}
                    yieldPositions={yieldPositions.positions}
                />

                <StakingPositionsCard
                    symbols={stakingPositions.symbols}
                    positions={stakingPositions.positions}
                />

                <YieldPositionsCard
                    positions={yieldPositions.positions}
                    icons={yieldPositions.vaultIcons}
                    claimItems={yieldClaim.claimItems}
                    claimAccountItems={yieldClaim.claimAccountItems}
                    claimTokens={yieldClaim.claimTokens}
                    totalClaimableFiatAmount={yieldClaim.totalClaimableFiatAmount}
                    isClaimItemsLoading={yieldClaim.isClaimItemsLoading}
                />
            </VStack>
        </VStack>
    );
};
