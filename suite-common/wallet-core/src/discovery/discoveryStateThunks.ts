import { type AnalyticsDep, events } from '@suite-common/analytics';
import { type DiscoveryStatus } from '@suite-common/wallet-types';
import { type DeviceUniquePath } from '@trezor/connect';
import { type WithServices, createThunk } from '@trezor/redux-utils';

import { DISCOVERY_MODULE_PREFIX, discoveryActions } from './discoveryActions';
import { type DiscoveryRootState } from './discoveryReducer';
import { selectDiscoveryByDevicePath } from './discoverySelectors';
import { getDiscoveryOutcome, getReportableErrorCode, hasDiscoveryEnded } from './discoveryUtils';

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
        dispatch(discoveryActions.updateDiscovery(status, path));

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
    dispatch(discoveryActions.deleteDiscovery(path));

    // Forgetting a device deletes its discovery, which ends a run that has no outcome yet.
    const trigger = deletedDiscovery?.trigger;
    if (trigger !== undefined && !hasDiscoveryEnded(deletedDiscovery)) {
        extra.services.analytics.report({
            type: events.accountsDiscoveryResultEvent.name,
            payload: { outcome: 'cancelled', trigger },
        });
    }
});
