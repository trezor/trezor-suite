import { useEffect, useRef } from 'react';

import { type SendEnsResolutionDirection, events, injectDesktopAnalytics } from '@suite/analytics';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type ResolveState, getSettledResolveDirection } from '@suite-common/wallet-core';
import { useServices } from '@trezor/dependency-injection';

type UseReportEnsResolutionToAnalyticsParams = ResolveState & {
    symbol: NetworkSymbol;
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
    const { analytics } = useServices(injectDesktopAnalytics);
    const reportedDirectionsRef = useRef<SendEnsResolutionDirection[]>([]);
    const direction = getSettledResolveDirection({ mode, isFetching, isSuccess, isError });

    useEffect(() => {
        if (!direction || reportedDirectionsRef.current.includes(direction)) return;

        reportedDirectionsRef.current = [...reportedDirectionsRef.current, direction];
        analytics.report({
            type: events.sendEnsResolutionEvent.name,
            payload: { assetSymbol: symbol, direction },
        });
    }, [analytics, direction, symbol]);
};
