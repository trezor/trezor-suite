import { useCallback, useRef } from 'react';

import { useNavigation } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { injectNativeAnalytics } from '@suite-native/analytics';
import { useServices } from '@trezor/dependency-injection';

type EarnReviewCancellationAnalyticsParams = {
    networkSymbol: string | undefined;
    txType: 'stake' | 'yield';
};

export const useEarnReviewCancellationAnalytics = ({
    networkSymbol,
    txType,
}: EarnReviewCancellationAnalyticsParams) => {
    const { analytics } = useServices(injectNativeAnalytics);
    const navigation = useNavigation();
    const hasReported = useRef(false);

    return useCallback(
        (actionType?: string) => {
            if (
                hasReported.current ||
                !networkSymbol ||
                !navigation.isFocused() ||
                !actionType ||
                !['GO_BACK', 'POP_TO_TOP'].includes(actionType)
            )
                return;
            hasReported.current = true;

            analytics.report({
                type: events.transactionCancelEvent.name,
                payload: { networkSymbol, txType, stage: 'review' },
            });
        },
        [analytics, navigation, networkSymbol, txType],
    );
};
