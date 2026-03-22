import { useCallback, useState } from 'react';

import { type AnalyticsSendFlowStep, events } from '@suite-native/analytics';
import { useAnalytics } from '@suite-native/services';
import { isNotNullOrUndefined } from '@trezor/utils';

import { SendStackRoutes, TransactionDetailStackRoutes } from '../routes';

type AnalyticsRelevantSendRoute = Exclude<`${SendStackRoutes}`, `${SendStackRoutes.SendAccounts}`>;

// Analytics don't care about the accounts list step, so we filter it out.
const orderedRelevantScreensForAnalytics = Object.values<string>(SendStackRoutes).filter(
    screen => screen != SendStackRoutes.SendAccounts,
);

const screenNameToAnalyticsLabelMap = {
    [SendStackRoutes.SendOutputs]: 'address_and_amount',
    [SendStackRoutes.SendAddressReview]: 'address_review',
    [SendStackRoutes.SendOutputsReview]: 'outputs_review',
    [SendStackRoutes.SendDestinationTagReview]: 'destination_tag_review',
    [SendStackRoutes.SendUtxo]: 'utxo_selection',
} as const satisfies Record<AnalyticsRelevantSendRoute, AnalyticsSendFlowStep>;

const isAnalyticsRelevantSendRoute = (
    routeName?: string,
): routeName is AnalyticsRelevantSendRoute =>
    isNotNullOrUndefined(routeName) && orderedRelevantScreensForAnalytics.includes(routeName);

export const useReportSendFlowExitToAnalytics = () => {
    const [furthestSendStep, setFurthestSendStep] = useState<AnalyticsRelevantSendRoute | null>(
        null,
    );
    const analytics = useAnalytics();
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
            if (nextScreenRoute === TransactionDetailStackRoutes.TransactionDetail) {
                setFurthestSendStep(null);

                return;
            }

            // We are navigation outside of the send flow without successful transaction dispatch. Report the furthest step to analytics.
            if (furthestSendStep) {
                analytics.report({
                    type: events.sendFlowExitedEvent.name,
                    payload: { step: screenNameToAnalyticsLabelMap[furthestSendStep] },
                });
                setFurthestSendStep(null);
            }
        },
        [furthestSendStep, analytics],
    );

    return reportSendFlowExitToAnalytics;
};
