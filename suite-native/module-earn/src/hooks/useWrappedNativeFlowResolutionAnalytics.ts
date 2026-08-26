import { useEffect, useRef } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type EvmPendingTxStatus, type WrappedNativeFlowType } from '@suite-common/wallet-core';
import { useCurrentRef } from '@trezor/react-utils';

import { useWrappedNativeFlowReport } from './useWrappedNativeFlowReport';
import { getWrappedNativeResolutionPayload } from '../utils/wrappedNativeAnalyticsUtils';

type UseWrappedNativeFlowResolutionAnalyticsParams = {
    flowType: WrappedNativeFlowType;
    networkSymbol: NetworkSymbol | undefined;
    status: EvmPendingTxStatus | null;
    txid: string | null;
};

export const useWrappedNativeFlowResolutionAnalytics = ({
    flowType,
    networkSymbol,
    status,
    txid,
}: UseWrappedNativeFlowResolutionAnalyticsParams) => {
    const report = useWrappedNativeFlowReport(flowType);
    const hasReportedResolutionRef = useRef(false);
    const startRef = useRef<{ txid: string; startedAt: number } | null>(null);

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
