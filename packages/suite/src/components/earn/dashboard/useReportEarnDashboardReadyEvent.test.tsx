import { type PropsWithChildren } from 'react';

import { act, renderHook } from '@testing-library/react';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { ServicesProvider, mock } from '@trezor/dependency-injection';

import {
    type StakingDashboardReadyPayload,
    type YieldDashboardReadyPayload,
    useReportEarnDashboardReadyEvent,
} from './useReportEarnDashboardReadyEvent';

const staking: StakingDashboardReadyPayload = {
    hasStakingPosition: true,
    availableStakingCount: 4,
    hasShowMore: true,
};
const yieldState: YieldDashboardReadyPayload = {
    hasYieldPosition: true,
    hasClaimBanner: true,
    availableVaultCount: 3,
    hasShowMore: false,
};

type Props = Parameters<typeof useReportEarnDashboardReadyEvent>[0];
const enabled: Props = { isStakingDisabled: false, isYieldDisabled: false };

const renderDashboardAnalytics = (initialProps: Props = enabled) => {
    const services: DesktopAnalyticsDep = {
        analytics: mockDesktopAnalytics(mock<DesktopAnalyticsDep['analytics']['report']>()),
    };
    const view = renderHook(useReportEarnDashboardReadyEvent, {
        initialProps,
        wrapper: ({ children }: PropsWithChildren) => (
            <ServicesProvider services={services}>{children}</ServicesProvider>
        ),
    });

    return { ...view, analytics: services.analytics };
};

describe('Earn dashboard ready analytics', () => {
    it.each(['staking', 'yield'] as const)(
        'waits for both sections when %s is ready first',
        first => {
            const { result, analytics } = renderDashboardAnalytics();

            act(() => {
                if (first === 'staking') {
                    result.current.onStakingReady(staking);
                } else {
                    result.current.onYieldReady(yieldState);
                }
            });
            expect(analytics.report).not.toHaveBeenCalled();

            act(() => {
                if (first === 'staking') {
                    result.current.onYieldReady(yieldState);
                } else {
                    result.current.onStakingReady(staking);
                }
            });
            expect(analytics.report).toHaveBeenCalledTimes(1);
            expect(analytics.report).toHaveBeenCalledWith({
                type: 'earn/dashboard-ready',
                payload: {
                    hasYieldPosition: true,
                    hasStakingPosition: true,
                    hasClaimBanner: true,
                    availableVaultCount: 3,
                    availableStakingCount: 4,
                    hasShowMore: true,
                },
            });

            act(() => {
                result.current.onStakingReady({ ...staking, hasStakingPosition: false });
                result.current.onYieldReady({ ...yieldState, hasShowMore: true });
            });
            expect(analytics.report).toHaveBeenCalledTimes(1);
        },
    );

    it('reports yield without waiting for disabled staking', () => {
        const { result, analytics } = renderDashboardAnalytics({
            ...enabled,
            isStakingDisabled: true,
        });

        act(() => result.current.onYieldReady({ ...yieldState, hasShowMore: true }));

        expect(analytics.report).toHaveBeenCalledWith({
            type: 'earn/dashboard-ready',
            payload: {
                ...yieldState,
                hasShowMore: true,
                hasStakingPosition: false,
                availableStakingCount: 0,
            },
        });
    });

    it('reports staking without waiting for disabled yield', () => {
        const { result, analytics } = renderDashboardAnalytics({
            ...enabled,
            isYieldDisabled: true,
        });

        act(() => result.current.onStakingReady(staking));

        expect(analytics.report).toHaveBeenCalledWith({
            type: 'earn/dashboard-ready',
            payload: {
                ...staking,
                hasYieldPosition: false,
                hasClaimBanner: false,
                availableVaultCount: 0,
            },
        });
    });

    it('reports an empty dashboard when both sections are disabled', () => {
        const { analytics } = renderDashboardAnalytics({
            isStakingDisabled: true,
            isYieldDisabled: true,
        });

        expect(analytics.report).toHaveBeenCalledWith({
            type: 'earn/dashboard-ready',
            payload: {
                hasYieldPosition: false,
                hasStakingPosition: false,
                hasClaimBanner: false,
                availableVaultCount: 0,
                availableStakingCount: 0,
                hasShowMore: false,
            },
        });
    });

    it('can finish readiness when a pending section is disabled', () => {
        const { result, analytics, rerender } = renderDashboardAnalytics();
        act(() => result.current.onStakingReady(staking));
        expect(analytics.report).not.toHaveBeenCalled();

        rerender({ ...enabled, isYieldDisabled: true });

        expect(analytics.report).toHaveBeenCalledTimes(1);
    });
});
