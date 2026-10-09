import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { events } from '@suite-common/analytics';
import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { injectNativeAnalytics } from '@suite-native/analytics';
import { useServices } from '@trezor/dependency-injection';

import { type EarnListRootState, selectYieldPromoListItems } from '../../earnScreenSelectors';

type UseReportYieldDashboardReadyEventProps = {
    yieldOpportunities: YieldDtoV2[];
    isLoading: boolean;
    positionsCount: number;
    claimItemsCount: number;
};

export const useReportYieldDashboardReadyEvent = ({
    yieldOpportunities,
    isLoading,
    positionsCount,
    claimItemsCount,
}: UseReportYieldDashboardReadyEventProps) => {
    const { analytics } = useServices(injectNativeAnalytics);

    const vaults = useSelector((state: EarnListRootState) =>
        selectYieldPromoListItems(state, yieldOpportunities),
    );

    const hasReportedYieldDashboardReadyRef = useRef(false);

    useEffect(() => {
        if (hasReportedYieldDashboardReadyRef.current || isLoading) return;

        hasReportedYieldDashboardReadyRef.current = true;

        analytics.report({
            type: events.yieldEarnDashboardReadyEvent.name,
            payload: {
                hasClaimBanner: claimItemsCount > 0,
                hasActivePosition: positionsCount > 0,
                availableVaultCount: vaults.length,
            },
        });
    }, [analytics, vaults.length, isLoading, positionsCount, claimItemsCount]);
};
