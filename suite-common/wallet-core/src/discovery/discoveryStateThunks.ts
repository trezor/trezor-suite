import { type AnalyticsDep, events } from '@suite-common/analytics';
import { type DiscoveryStatus } from '@suite-common/wallet-types';
import { type DeviceUniquePath } from '@trezor/connect';
import { type WithServices, createOwnedAction, createThunk } from '@trezor/redux-utils';

import { DISCOVERY_MODULE_PREFIX } from './discoveryActions';
import { selectDiscoveryByDevicePath } from './discoverySelectors';
import { type DiscoveryRootState } from './discoveryTypes';
import { getDiscoveryOutcome, getReportableErrorCode, hasDiscoveryEnded } from './discoveryUtils';

// Private on purpose: a discovery may only change through updateDiscoveryThunk and deleteDiscoveryThunk,
// which report the outcome of the run. Reducers and middlewares get the matchers.
const { create: updateDiscovery, matcher: updateDiscoveryMatcher } = createOwnedAction(
    `${DISCOVERY_MODULE_PREFIX}/update`,
    (status: DiscoveryStatus, path: DeviceUniquePath) => ({
        payload: {
            status,
            path,
        },
    }),
);

const { create: deleteDiscovery, matcher: deleteDiscoveryMatcher } = createOwnedAction(
    `${DISCOVERY_MODULE_PREFIX}/delete`,
    (path: DeviceUniquePath) => ({
        payload: {
            path,
        },
    }),
);

export { deleteDiscoveryMatcher, updateDiscoveryMatcher };

const DEVICE_CANCELLATION_ERROR_CODES = ['Failure_ActionCancelled', 'Failure_PinCancelled'];

type UpdateDiscoveryThunkParams = {
    status: DiscoveryStatus;
    path: DeviceUniquePath;
    isSilent?: boolean;
};

export type UpdateDiscoveryThunkState = DiscoveryRootState;

export type UpdateDiscoveryThunkDeps = WithServices<AnalyticsDep>;

export const updateDiscoveryThunk = createThunk<
    void,
    UpdateDiscoveryThunkParams,
    { state: UpdateDiscoveryThunkState; extra: UpdateDiscoveryThunkDeps }
>(
    `${DISCOVERY_MODULE_PREFIX}/updateDiscovery`,
    ({ status, path, isSilent = false }, { dispatch, getState, extra }) => {
        const previousDiscovery = selectDiscoveryByDevicePath(getState(), path);
        dispatch(updateDiscovery(status, path));

        const outcome = getDiscoveryOutcome(status);
        const trigger = previousDiscovery?.trigger;
        const isFirstOutcomeOfRun = !hasDiscoveryEnded(previousDiscovery);

        if (isSilent || outcome === undefined || trigger === undefined || !isFirstOutcomeOfRun) {
            return;
        }

        // Discovery keeps a run cancelled on the device as failed, so that it can be retried.
        // `Method_Cancel` stays a failure: it also comes from other features cancelling every Connect call.
        const isCancelledFailure =
            status.status === 'failed' &&
            status.errorCode !== undefined &&
            DEVICE_CANCELLATION_ERROR_CODES.includes(status.errorCode);
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
    },
);

export type DeleteDiscoveryThunkState = DiscoveryRootState;

export type DeleteDiscoveryThunkDeps = WithServices<AnalyticsDep>;

export const deleteDiscoveryThunk = createThunk<
    void,
    DeviceUniquePath,
    { state: DeleteDiscoveryThunkState; extra: DeleteDiscoveryThunkDeps }
>(`${DISCOVERY_MODULE_PREFIX}/deleteDiscovery`, (path, { dispatch, getState, extra }) => {
    const deletedDiscovery = selectDiscoveryByDevicePath(getState(), path);
    dispatch(deleteDiscovery(path));

    // Forgetting a device deletes its discovery, which ends a run that has no outcome yet.
    const trigger = deletedDiscovery?.trigger;
    if (trigger !== undefined && !hasDiscoveryEnded(deletedDiscovery)) {
        extra.services.analytics.report({
            type: events.accountsDiscoveryResultEvent.name,
            payload: { outcome: 'cancelled', trigger },
        });
    }
});
