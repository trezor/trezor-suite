import { useEffect, useRef } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type ResolveState, getSettledResolveDirection } from '@suite-common/wallet-core';
import {
    type SendEnsResolutionDirection,
    events,
    injectNativeAnalytics,
} from '@suite-native/analytics';

type UseReportEnsResolutionToAnalyticsParams = ResolveState & {
    symbol: NetworkSymbol | null | undefined;
};

/**
 * Reports that the recipient field resolved a name, and in which direction. Never the name, the
 * address, or whether the lookup found anything — and only once per direction per recipient input,
 * so the report cannot be tied back to an individual lookup.
 */
export const useReportEnsResolutionToAnalytics = ({
    symbol,
    mode,
    isFetching,
    isSuccess,
    isError,
}: UseReportEnsResolutionToAnalyticsParams) => {
    const { analytics } = useServices(injectNativeAnalytics);
    const reportedDirectionsRef = useRef<SendEnsResolutionDirection[]>([]);
    const direction = getSettledResolveDirection({ mode, isFetching, isSuccess, isError });

    useEffect(() => {
        if (!symbol || !direction) return;
        if (reportedDirectionsRef.current.includes(direction)) return;

        reportedDirectionsRef.current = [...reportedDirectionsRef.current, direction];
        analytics.report({
            type: events.sendEnsResolutionEvent.name,
            payload: { assetSymbol: symbol, direction },
        });
    }, [analytics, direction, symbol]);
};
