import { type UnknownAction } from '@reduxjs/toolkit';

import { type AnalyticsDep, events } from '@suite-common/analytics';
import { type WithServices, createMiddlewareWithExtraDeps } from '@trezor/redux-utils';

import { discoveryActions } from './discoveryActions';
import { type DiscoveryRootState } from './discoveryReducer';
import { selectDiscoveryByDevicePath } from './discoverySelectors';
import { getDiscoveryOutcome, getReportableErrorCode } from './discoveryUtils';

export type DiscoveryAnalyticsMiddlewareState = DiscoveryRootState;

export const prepareDiscoveryAnalyticsMiddleware = createMiddlewareWithExtraDeps<
    WithServices<AnalyticsDep>,
    UnknownAction,
    DiscoveryAnalyticsMiddlewareState
>((action, { getState, next, extra }) => {
    if (discoveryActions.deleteDiscovery.match(action)) {
        const deletedDiscovery = selectDiscoveryByDevicePath(getState(), action.payload.path);
        next(action);

        // Forgetting a device deletes its discovery, which ends a run that has no outcome yet.
        const trigger = deletedDiscovery?.trigger;
        if (trigger !== undefined && getDiscoveryOutcome(deletedDiscovery) === undefined) {
            extra.services.analytics.report({
                type: events.accountsDiscoveryResultEvent.name,
                payload: { outcome: 'cancelled', trigger },
            });
        }

        return action;
    }

    if (!discoveryActions.updateDiscovery.match(action)) return next(action);

    const previousDiscovery = selectDiscoveryByDevicePath(getState(), action.payload.path);
    next(action);

    const { status } = action.payload;
    const outcome = getDiscoveryOutcome(status);
    const trigger = previousDiscovery?.trigger;
    const isFirstOutcomeOfRun = getDiscoveryOutcome(previousDiscovery) === undefined;

    if (
        action.meta.isSilent ||
        outcome === undefined ||
        trigger === undefined ||
        !isFirstOutcomeOfRun
    ) {
        return action;
    }

    // Discovery keeps a run cancelled on the device as failed, so that it can be retried.
    // `Method_Cancel` stays a failure: it also comes from other features cancelling every Connect call.
    const isCancelledFailure =
        status.status === 'failed' && status.errorCode === 'Failure_ActionCancelled';
    const errorCode =
        status.status === 'failed' && !isCancelledFailure
            ? getReportableErrorCode(status.errorCode)
            : undefined;

    extra.services.analytics.report({
        type: events.accountsDiscoveryResultEvent.name,
        payload: {
            outcome: isCancelledFailure ? 'cancelled' : outcome,
            trigger,
            ...(errorCode !== undefined && { errorCode }),
        },
    });

    return action;
});
