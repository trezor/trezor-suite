import { useCallback, useEffect, useRef } from 'react';

import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { type EventInstance, events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import {
    type WrappedNativeFlowType,
    type WrappedNativePendingTxStatus,
} from '@suite-common/wallet-core';
import { useCurrentRef } from '@trezor/react-utils';

// Wrap and unwrap share one attribute schema, so one payload type serves both events.
type WrappedNativeFlowPayload = EventInstance<typeof events.yieldWrapEvent>['payload'];

type UseWrappedNativeFlowAnalyticsParams = {
    flowType: WrappedNativeFlowType;
    status: WrappedNativePendingTxStatus | null;
    txid: string | null;
    networkSymbol: string;
};

/**
 * Fires the `yield/wrap` / `yield/unwrap` events for the standalone wrap/unwrap flows: `submit` via
 * the returned `reportSubmit`, `success` / `error` on-chain, `leftPending` if the user leaves first.
 * `reportMaxClick` fires the max-button `yield/interaction` event.
 */
export const useWrappedNativeFlowAnalytics = ({
    flowType,
    status,
    txid,
    networkSymbol,
}: UseWrappedNativeFlowAnalyticsParams) => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const hasReportedResolutionRef = useRef(false);
    const startRef = useRef<{ txid: string; startedAt: number } | null>(null);

    const report = useCallback(
        (payload: WrappedNativeFlowPayload) => {
            if (flowType === 'wrap') {
                analytics.report({ type: events.yieldWrapEvent.name, payload });
            } else {
                analytics.report({ type: events.yieldUnwrapEvent.name, payload });
            }
        },
        [analytics, flowType],
    );

    const reportSubmit = useCallback(() => {
        report({ type: 'submit', action: 'continue', networkSymbol });
    }, [report, networkSymbol]);

    // No `vaultId` — that is what separates these from the in-flow deposit-max / withdraw-max.
    const reportMaxClick = useCallback(() => {
        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: flowType === 'wrap' ? 'wrap-max' : 'unwrap-max',
                networkSymbol,
            },
        });
    }, [analytics, flowType, networkSymbol]);

    // Timed in an effect rather than during render so the hook stays pure.
    useEffect(() => {
        if (txid && startRef.current?.txid !== txid) {
            startRef.current = { txid, startedAt: Date.now() };
            hasReportedResolutionRef.current = false;
        }
    }, [txid]);

    useEffect(() => {
        if (hasReportedResolutionRef.current || (status !== 'confirmed' && status !== 'failed')) {
            return;
        }

        hasReportedResolutionRef.current = true;
        const durationMs = startRef.current ? Date.now() - startRef.current.startedAt : undefined;

        report(
            status === 'confirmed'
                ? { type: 'success', action: 'continue', networkSymbol, durationMs }
                : {
                      type: 'error',
                      action: 'continue',
                      networkSymbol,
                      errorMessage: 'on-chain-failure',
                      durationMs,
                  },
        );
    }, [status, networkSymbol, report]);

    const latestRef = useCurrentRef({ status, networkSymbol });

    useEffect(
        () => () => {
            const snapshot = latestRef.current;
            if (hasReportedResolutionRef.current || snapshot.status !== 'pending') {
                return;
            }

            report({
                type: 'leftPending',
                action: 'continue',
                networkSymbol: snapshot.networkSymbol,
                durationMs: startRef.current ? Date.now() - startRef.current.startedAt : undefined,
            });
        },
        [report, latestRef],
    );

    return { reportSubmit, reportMaxClick };
};
