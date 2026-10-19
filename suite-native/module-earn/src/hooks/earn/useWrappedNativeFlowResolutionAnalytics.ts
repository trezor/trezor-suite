import { useEffect, useRef } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type EvmPendingTxStatus, type WrappedNativeFlowType } from '@suite-common/wallet-core';
import { useCurrentRef } from '@trezor/react-utils';

import { useWrappedNativeFlowReport } from './useWrappedNativeFlowReport';
import { getWrappedNativeResolutionPayload } from '../../utils/earn/wrappedNativeAnalyticsUtils';

type UseWrappedNativeFlowResolutionAnalyticsParams = {
    flowType: WrappedNativeFlowType;
    networkSymbol: NetworkSymbol | undefined;
    status: EvmPendingTxStatus | null;
    txid: string | null;
    submittedAt?: number;
};

export const useWrappedNativeFlowResolutionAnalytics = ({
    flowType,
    networkSymbol,
    status,
    txid,
    submittedAt,
}: UseWrappedNativeFlowResolutionAnalyticsParams) => {
    const report = useWrappedNativeFlowReport(flowType);
    const hasReportedResolutionRef = useRef(false);
    const startRef = useRef<{ txid: string; startedAt: number } | null>(null);

    useEffect(() => {
        if (txid && startRef.current?.txid !== txid) {
            startRef.current = { txid, startedAt: submittedAt ?? Date.now() };
            hasReportedResolutionRef.current = false;
        }
    }, [submittedAt, txid]);

    useEffect(() => {
        if (!txid || hasReportedResolutionRef.current) {
            return;
        }

        const durationMs = startRef.current ? Date.now() - startRef.current.startedAt : undefined;
        const payload = getWrappedNativeResolutionPayload({ durationMs, networkSymbol, status });

        if (!payload) {
            return;
        }

        hasReportedResolutionRef.current = true;
        report(payload);
    }, [networkSymbol, report, status, txid]);

    const latestRef = useCurrentRef({ status, networkSymbol, txid });

    useEffect(
        () => () => {
            const snapshot = latestRef.current;

            if (
                !snapshot.txid ||
                hasReportedResolutionRef.current ||
                snapshot.status !== 'pending'
            ) {
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
