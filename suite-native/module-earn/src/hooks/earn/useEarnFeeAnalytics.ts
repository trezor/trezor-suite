import { useCallback, useEffect, useRef } from 'react';

import { type EventInstance, events } from '@suite-common/analytics';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type EarnTransactionFlow } from '@suite-common/wallet-core';
import { injectNativeAnalytics } from '@suite-native/analytics';
import { useServices } from '@trezor/dependency-injection';

type FeeEventElement = Extract<
    EventInstance<typeof events.yieldInteractionEvent>['payload']['element'],
    `fee-${string}`
>;

export type UseEarnFeeAnalyticsParams = {
    contextKey: string;
    flow: EarnTransactionFlow;
    networkSymbol?: NetworkSymbol;
    isEnabled: boolean;
    hasEstimationError: boolean;
    isFeeUnavailable: boolean;
    isReady: boolean;
    retry: () => void;
};

export const useEarnFeeAnalytics = ({
    contextKey,
    flow,
    networkSymbol,
    isEnabled,
    hasEstimationError,
    isFeeUnavailable,
    isReady,
    retry,
}: UseEarnFeeAnalyticsParams) => {
    const { analytics } = useServices(injectNativeAnalytics);
    const hasError = hasEstimationError || isFeeUnavailable;
    const episodeRef = useRef<{
        key: string;
        phase: 'initial' | 'failed' | 'retrying';
    }>({
        key: contextKey,
        phase: 'initial',
    });
    const reportFeeEvent = useCallback(
        (element: FeeEventElement) => {
            analytics.report({
                type: events.yieldInteractionEvent.name,
                payload: { element, value: flow, networkSymbol },
            });
        },
        [analytics, flow, networkSymbol],
    );

    useEffect(() => {
        if (episodeRef.current.key !== contextKey) {
            episodeRef.current = { key: contextKey, phase: 'initial' };
        }
        if (!isEnabled) return;

        if (hasError && episodeRef.current.phase !== 'failed') {
            reportFeeEvent(
                hasEstimationError ? 'fee-estimation-error-banner' : 'fee-unavailable-banner',
            );
            episodeRef.current.phase = 'failed';
        } else if (!hasError && isReady && episodeRef.current.phase !== 'initial') {
            reportFeeEvent('fee-estimation-recovered');
            episodeRef.current.phase = 'initial';
        }
    }, [contextKey, isEnabled, hasError, isReady, hasEstimationError, reportFeeEvent]);

    return useCallback(() => {
        if (
            isEnabled &&
            episodeRef.current.key === contextKey &&
            episodeRef.current.phase === 'failed'
        ) {
            reportFeeEvent('fee-estimation-retry');
            episodeRef.current.phase = 'retrying';
        }
        retry();
    }, [contextKey, isEnabled, reportFeeEvent, retry]);
};
