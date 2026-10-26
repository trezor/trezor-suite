import { useCallback, useEffect, useRef } from 'react';

import { events } from '@suite-common/analytics';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { injectNativeAnalytics } from '@suite-native/analytics';
import { useServices } from '@trezor/dependency-injection';

export type EarnFeeFlow = events.TransactionBroadcastStatusFlow;

type UseEarnFeeAnalyticsParams = {
    contextKey: string;
    flow?: EarnFeeFlow;
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

    useEffect(() => {
        if (episodeRef.current.key !== contextKey) {
            episodeRef.current = { key: contextKey, phase: 'initial' };
        }
        if (!isEnabled || !flow) return;

        if (hasError && episodeRef.current.phase !== 'failed') {
            analytics.report({
                type: events.yieldInteractionEvent.name,
                payload: {
                    element: hasEstimationError
                        ? 'fee-estimation-error-banner'
                        : 'fee-unavailable-banner',
                    value: flow,
                    networkSymbol,
                },
            });
            episodeRef.current.phase = 'failed';
        } else if (!hasError && isReady && episodeRef.current.phase !== 'initial') {
            analytics.report({
                type: events.yieldInteractionEvent.name,
                payload: { element: 'fee-estimation-recovered', value: flow, networkSymbol },
            });
            episodeRef.current.phase = 'initial';
        }
    }, [
        analytics,
        contextKey,
        flow,
        networkSymbol,
        isEnabled,
        hasError,
        isReady,
        hasEstimationError,
    ]);

    return useCallback(() => {
        if (
            isEnabled &&
            flow &&
            episodeRef.current.key === contextKey &&
            episodeRef.current.phase === 'failed'
        ) {
            analytics.report({
                type: events.yieldInteractionEvent.name,
                payload: { element: 'fee-estimation-retry', value: flow, networkSymbol },
            });
            episodeRef.current.phase = 'retrying';
        }
        retry();
    }, [analytics, contextKey, flow, isEnabled, networkSymbol, retry]);
};
