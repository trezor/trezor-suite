import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { injectNativeAnalytics } from '@suite-native/analytics';

import { useYieldOpportunities } from './useYieldOpportunities';
import {
    type EarnListRootState,
    selectYieldClaimListItems,
    selectYieldListItems,
    selectYieldPromoListItems,
} from '../../earnScreenSelectors';
import { useClaimRewardsWithFiat } from '../../hooks/yield/useClaimRewardsWithFiat';

export const useReportYieldDashboardReadyEvent = () => {
    const { analytics } = useServices(injectNativeAnalytics);

    const { yieldOpportunities, isLoading: isYieldOpportunitiesLoading } = useYieldOpportunities();

    const vaults = useSelector((state: EarnListRootState) =>
        selectYieldPromoListItems(state, yieldOpportunities),
    );

    const { claimRewardsWithFiat, isClaimLoading } = useClaimRewardsWithFiat();

    const positions = useSelector((state: EarnListRootState) =>
        selectYieldListItems(state, yieldOpportunities),
    );

    const claimItems = useSelector((state: EarnListRootState) =>
        selectYieldClaimListItems(state, claimRewardsWithFiat),
    );

    const hasReportedYieldDashboardReadyRef = useRef(false);

    useEffect(() => {
        if (hasReportedYieldDashboardReadyRef.current) return;
        if (isClaimLoading || isYieldOpportunitiesLoading) return;

        hasReportedYieldDashboardReadyRef.current = true;

        analytics.report({
            type: events.yieldEarnDashboardReadyEvent.name,
            payload: {
                hasClaimBanner: claimItems.length > 0,
                hasActivePosition: positions.length > 0,
                availableVaultCount: vaults.length,
            },
        });
    }, [
        analytics,
        vaults.length,
        isClaimLoading,
        isYieldOpportunitiesLoading,
        claimItems.length,
        positions.length,
    ]);
};
