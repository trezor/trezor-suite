import { useCallback, useEffect, useRef } from 'react';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import {
    type WrappedNativeFlowType,
    type WrappedNativePendingTxStatus,
} from '@suite-common/wallet-core';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { useCurrentRef } from '@trezor/react-utils';

import {
    type WrappedNativeFlowPayload,
    buildWrappedNativeFlowEvent,
    getWrappedNativeMaxInteractionElement,
    getWrappedNativeResolutionPayload,
} from '../utils/wrappedNativeAnalyticsUtils';

type UseWrappedNativeFlowAnalyticsParams = {
    flowType: WrappedNativeFlowType;
    networkSymbol: string;
};

export const useWrappedNativeFlowAnalytics = ({
    flowType,
    networkSymbol,
}: UseWrappedNativeFlowAnalyticsParams) => {
    const { analytics } = useServices(selectNativeAnalyticsDep);

    const report = useCallback(
        (payload: WrappedNativeFlowPayload) =>
            analytics.report(buildWrappedNativeFlowEvent(flowType, payload)),
        [analytics, flowType],
    );

    const reportSubmit = useCallback(() => {
        report({ type: 'submit', action: 'continue', networkSymbol });
    }, [report, networkSymbol]);

    const reportSimulation = useCallback(
        (action: 'continue' | 'cancel') => {
            report({ type: 'tx-simulation-modal', action, networkSymbol });
        },
        [report, networkSymbol],
    );

    const reportSent = useCallback(() => {
        report({ type: 'sent', action: 'continue', networkSymbol });
    }, [report, networkSymbol]);

    const reportError = useCallback(
        (errorMessage: string) => {
            report({ type: 'error', action: 'continue', networkSymbol, errorMessage });
        },
        [report, networkSymbol],
    );

    const reportMaxSelected = useCallback(() => {
        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: getWrappedNativeMaxInteractionElement(flowType),
                networkSymbol,
            },
        });
    }, [analytics, flowType, networkSymbol]);

    return { reportSubmit, reportSimulation, reportSent, reportError, reportMaxSelected };
};

type UseWrappedNativeFlowResolutionAnalyticsParams = {
    flowType: WrappedNativeFlowType;
    networkSymbol: string;
    status: WrappedNativePendingTxStatus | null;
    txid: string | null;
};

export const useWrappedNativeFlowResolutionAnalytics = ({
    flowType,
    networkSymbol,
    status,
    txid,
}: UseWrappedNativeFlowResolutionAnalyticsParams) => {
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const hasReportedResolutionRef = useRef(false);
    const startRef = useRef<{ txid: string; startedAt: number } | null>(null);

    const report = useCallback(
        (payload: WrappedNativeFlowPayload) =>
            analytics.report(buildWrappedNativeFlowEvent(flowType, payload)),
        [analytics, flowType],
    );

    useEffect(() => {
        if (txid && startRef.current?.txid !== txid) {
            startRef.current = { txid, startedAt: Date.now() };
            hasReportedResolutionRef.current = false;
        }
    }, [txid]);

    useEffect(() => {
        if (hasReportedResolutionRef.current) {
            return;
        }

        const durationMs = startRef.current ? Date.now() - startRef.current.startedAt : undefined;
        const payload = getWrappedNativeResolutionPayload({ durationMs, networkSymbol, status });

        if (!payload) {
            return;
        }

        hasReportedResolutionRef.current = true;
        report(payload);
    }, [networkSymbol, report, status]);

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
};
