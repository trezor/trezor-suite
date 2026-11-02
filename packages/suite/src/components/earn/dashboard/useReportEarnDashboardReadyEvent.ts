import { useCallback, useEffect, useRef } from 'react';

import { injectDesktopAnalytics } from '@suite/analytics';
import { type EventInstance, events } from '@suite-common/analytics';
import { useServices } from '@trezor/dependency-injection';

type DashboardReadyPayload = EventInstance<typeof events.earnDashboardReadyEvent>['payload'];
export type StakingDashboardReadyPayload = Pick<
    DashboardReadyPayload,
    'hasStakingPosition' | 'availableStakingCount' | 'hasShowMore'
>;
export type YieldDashboardReadyPayload = Omit<
    DashboardReadyPayload,
    'hasStakingPosition' | 'availableStakingCount'
>;

type UseReportEarnDashboardReadyEventParams = {
    isStakingDisabled: boolean;
    isYieldDisabled: boolean;
};

const EMPTY_STAKING: StakingDashboardReadyPayload = {
    hasStakingPosition: false,
    availableStakingCount: 0,
    hasShowMore: false,
};
const EMPTY_YIELD: YieldDashboardReadyPayload = {
    hasYieldPosition: false,
    hasClaimBanner: false,
    availableVaultCount: 0,
    hasShowMore: false,
};

export const useReportEarnDashboardReadyEvent = ({
    isStakingDisabled,
    isYieldDisabled,
}: UseReportEarnDashboardReadyEventParams) => {
    const { analytics } = useServices(injectDesktopAnalytics);
    const stakingRef = useRef<StakingDashboardReadyPayload | undefined>(undefined);
    const yieldRef = useRef<YieldDashboardReadyPayload | undefined>(undefined);
    const hasReportedRef = useRef(false);

    const reportReady = useCallback(() => {
        if (hasReportedRef.current) return;

        const staking = isStakingDisabled ? EMPTY_STAKING : stakingRef.current;
        const yieldState = isYieldDisabled ? EMPTY_YIELD : yieldRef.current;
        if (!staking || !yieldState) return;

        hasReportedRef.current = true;
        analytics.report({
            type: events.earnDashboardReadyEvent.name,
            payload: {
                hasYieldPosition: yieldState.hasYieldPosition,
                hasStakingPosition: staking.hasStakingPosition,
                hasClaimBanner: yieldState.hasClaimBanner,
                availableVaultCount: yieldState.availableVaultCount,
                availableStakingCount: staking.availableStakingCount,
                hasShowMore: staking.hasShowMore || yieldState.hasShowMore,
            },
        });
    }, [analytics, isStakingDisabled, isYieldDisabled]);

    const onStakingReady = useCallback(
        (payload: StakingDashboardReadyPayload) => {
            stakingRef.current = payload;
            reportReady();
        },
        [reportReady],
    );
    const onYieldReady = useCallback(
        (payload: YieldDashboardReadyPayload) => {
            yieldRef.current = payload;
            reportReady();
        },
        [reportReady],
    );

    useEffect(reportReady, [reportReady]);

    return { onStakingReady, onYieldReady };
};
