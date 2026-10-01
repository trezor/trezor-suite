import { useEffect, useRef } from 'react';

import { type SendEnsResolutionDirection, events, injectDesktopAnalytics } from '@suite/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type ResolveMode } from '@suite-common/wallet-core';

type ResolutionState = {
    mode: ResolveMode;
    isFetching: boolean;
    isSuccess: boolean;
    isError: boolean;
};

type UseReportEnsResolutionToAnalyticsParams = ResolutionState & {
    symbol: NetworkSymbol;
};

// Stays `null` until a lookup settles, so a value the user abandoned mid-typing is never counted.
const getResolutionDirection = ({
    mode,
    isFetching,
    isSuccess,
    isError,
}: ResolutionState): SendEnsResolutionDirection | null => {
    if (isFetching || !(isSuccess || isError)) return null;
    if (mode === 'forward') return 'direct';
    if (mode === 'reverse') return 'reverse';

    return null;
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
    const direction = getResolutionDirection({ mode, isFetching, isSuccess, isError });

    useEffect(() => {
        if (!direction || reportedDirectionsRef.current.includes(direction)) return;

        reportedDirectionsRef.current = [...reportedDirectionsRef.current, direction];
        analytics.report({
            type: events.sendEnsResolutionEvent.name,
            payload: { assetSymbol: symbol, direction },
        });
    }, [analytics, direction, symbol]);
};
