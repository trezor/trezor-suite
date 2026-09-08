import { useEffect, useRef } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type ResolveMode } from '@suite-common/wallet-core';
import {
    type SendEnsResolutionDirection,
    events,
    selectNativeAnalyticsDep,
} from '@suite-native/analytics';

type ResolutionState = {
    mode: ResolveMode;
    isFetching: boolean;
    isSuccess: boolean;
    isError: boolean;
};

type UseReportEnsResolutionToAnalyticsParams = ResolutionState & {
    symbol: NetworkSymbol | null | undefined;
};

/**
 * Names the direction of a resolution that has actually run. Stays `null` until a lookup settles,
 * so a value the user abandoned mid-typing is never counted, and it deliberately ignores what came
 * back — only that the field resolved something.
 */
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
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const reportedDirectionsRef = useRef<SendEnsResolutionDirection[]>([]);
    const direction = getResolutionDirection({ mode, isFetching, isSuccess, isError });

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
