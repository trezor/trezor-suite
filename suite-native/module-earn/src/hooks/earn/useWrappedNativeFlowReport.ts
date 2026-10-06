import { useCallback } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { type WrappedNativeFlowType } from '@suite-common/wallet-core';
import { injectNativeAnalytics } from '@suite-native/analytics';

import {
    type WrappedNativeFlowPayload,
    buildWrappedNativeFlowEvent,
} from '../../utils/earn/wrappedNativeAnalyticsUtils';

export const useWrappedNativeFlowReport = (flowType: WrappedNativeFlowType) => {
    const { analytics } = useServices(injectNativeAnalytics);

    return useCallback(
        (payload: WrappedNativeFlowPayload) =>
            analytics.report(buildWrappedNativeFlowEvent(flowType, payload)),
        [analytics, flowType],
    );
};
