import { useCallback } from 'react';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { type YieldWithdrawFlowType } from '@suite-common/wallet-core';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { exhaustive } from '@trezor/type-utils';

type UseYieldReviewAnalyticsParams = {
    flow: 'deposit' | 'withdraw' | 'claim';
    networkSymbol: string | undefined;
    vaultId?: string;
    operation?: YieldWithdrawFlowType;
};

type YieldReviewOutcome = { action: 'cancel' } | { errorMessage: string };

export const useYieldReviewAnalytics = ({
    flow,
    networkSymbol,
    vaultId,
    operation,
}: UseYieldReviewAnalyticsParams) => {
    const { analytics } = useServices(selectNativeAnalyticsDep);

    const reportOutcome = useCallback(
        (outcome: YieldReviewOutcome) => {
            const errorResolution =
                'errorMessage' in outcome
                    ? ({
                          action: 'continue',
                          type: 'error',
                          errorMessage: outcome.errorMessage,
                      } as const)
                    : null;

            switch (flow) {
                case 'deposit':
                    analytics.report({
                        type: events.yieldDepositEvent.name,
                        payload: {
                            networkSymbol,
                            vaultId,
                            ...(errorResolution ??
                                ({ action: 'cancel', type: 'deposit' } as const)),
                        },
                    });

                    return;
                case 'withdraw':
                    analytics.report({
                        type: events.yieldWithdrawEvent.name,
                        payload: {
                            networkSymbol,
                            vaultId,
                            operation,
                            ...(errorResolution ??
                                ({ action: 'cancel', type: 'withdraw' } as const)),
                        },
                    });

                    return;
                case 'claim':
                    analytics.report({
                        type: events.yieldClaimEvent.name,
                        payload: {
                            networkSymbol,
                            ...(errorResolution ?? ({ action: 'cancel', type: 'claim' } as const)),
                        },
                    });

                    return;
                default:
                    exhaustive(flow);
            }
        },
        [analytics, flow, networkSymbol, operation, vaultId],
    );

    const reportError = useCallback(
        (errorMessage: string) => reportOutcome({ errorMessage }),
        [reportOutcome],
    );
    const reportCancel = useCallback(() => reportOutcome({ action: 'cancel' }), [reportOutcome]);

    return { reportError, reportCancel };
};
