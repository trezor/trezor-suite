import { useCallback } from 'react';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type WrappedNativeFlowType } from '@suite-common/wallet-core';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';

import { useWrappedNativeFlowReport } from './useWrappedNativeFlowReport';
import { getWrappedNativeMaxInteractionElement } from '../utils/wrappedNativeAnalyticsUtils';

type UseWrappedNativeFlowAnalyticsParams = {
    flowType: WrappedNativeFlowType;
    networkSymbol: NetworkSymbol | undefined;
};

export const useWrappedNativeFlowAnalytics = ({
    flowType,
    networkSymbol,
}: UseWrappedNativeFlowAnalyticsParams) => {
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const report = useWrappedNativeFlowReport(flowType);

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
        (errorMessage: 'submit-failed' | 'push-failed') => {
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
