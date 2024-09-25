import { useCallback, useState } from 'react';

import { G } from '@mobily/ts-belt';

import { analytics, AnalyticsSendFlowStep, EventType } from '@suite-native/analytics';

import { RootStackRoutes, SendStackRoutes } from './routes';

type AnalyticsRelevantSendRoute = Exclude<`${SendStackRoutes}`, `${SendStackRoutes.SendAccounts}`>;

// Analytics don't care about the accounts list step, so we filter it out.
const orderedRelevantScreensForAnalytics = Object.values<string>(SendStackRoutes).filter(
    screen => screen != SendStackRoutes.SendAccounts,
);

const screenNameToAnalyticsLabelMap = {
    [SendStackRoutes.SendOutputs]: 'address_and_amount',
    [SendStackRoutes.SendFees]: 'fee_settings',
    [SendStackRoutes.SendAddressReview]: 'address_review',
    [SendStackRoutes.SendOutputsReview]: 'outputs_review',
} as const satisfies Record<AnalyticsRelevantSendRoute, AnalyticsSendFlowStep>;

const isAnalyticsRelevantSendRoute = (
    routeName?: string,
): routeName is AnalyticsRelevantSendRoute => {
    return G.isNotNullable(routeName) && orderedRelevantScreensForAnalytics.includes(routeName);
};

export const useReportSendFlowExitToAnalytics = () => {
    const [furthestSendStep, setFurthestSendStep] = useState<AnalyticsRelevantSendRoute | null>(
        null,
    );

    const reportSendFlowExitToAnalytics = useCallback(
        (nextScreenRoute?: string) => {
            // The user is still inside of the send flow.
            if (isAnalyticsRelevantSendRoute(nextScreenRoute)) {
                if (!furthestSendStep) {
                    setFurthestSendStep(nextScreenRoute);

                    return;
                }

                const currentFurthestIndex =
                    orderedRelevantScreensForAnalytics.indexOf(nextScreenRoute);
                const previousFurthestIndex =
                    orderedRelevantScreensForAnalytics.indexOf(furthestSendStep);

                if (currentFurthestIndex > previousFurthestIndex) {
                    setFurthestSendStep(nextScreenRoute);
                }

                return;
            }

            // This means successful dispatch of the transaction, we don't want to report that.
            if (nextScreenRoute === RootStackRoutes.TransactionDetail) {
                setFurthestSendStep(null);

                return;
            }

            // We are navigation outside of the send flow without successful transaction dispatch. Report the furthest step to analytics.
            if (furthestSendStep) {
                analytics.report({
                    type: EventType.SendFlowExited,
                    payload: { step: screenNameToAnalyticsLabelMap[furthestSendStep] },
                });
                setFurthestSendStep(null);
            }
        },
        [setFurthestSendStep, furthestSendStep],
    );

    return reportSendFlowExitToAnalytics;
};
