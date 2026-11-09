import { type AnalyticsDep, events } from '@suite-common/analytics';
import { type DeviceRootState } from '@suite-common/device';
import { type DiscoveryStatus } from '@suite-common/wallet-types';
import { isAccountFailed } from '@suite-common/wallet-utils';
import { type DeviceUniquePath } from '@trezor/connect';
import { type WithServices, createOwnedAction, createThunk } from '@trezor/redux-utils';

import { DISCOVERY_MODULE_PREFIX } from './discoveryActions';
import { selectDiscoveryByDevicePath } from './discoverySelectors';
import { type DiscoveryRootState } from './discoveryTypes';
import { getDiscoveryOutcome, getReportableErrorCode, hasDiscoveryEnded } from './discoveryUtils';
import { type AccountsRootState } from '../accounts/accountsReducer';
import { selectDeviceAccounts } from '../accounts/accountsSelectors';

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

const selectFailedDeviceAccount = (state: DeviceRootState & AccountsRootState) => {
    const failedAccounts = selectDeviceAccounts(state).filter(isAccountFailed);

    return failedAccounts.find(account => account.errorCode !== undefined) ?? failedAccounts[0];
};

type UpdateDiscoveryThunkParams = {
    status: DiscoveryStatus;
    path: DeviceUniquePath;
    isSilent?: boolean;
};

export type UpdateDiscoveryThunkState = DiscoveryRootState & DeviceRootState & AccountsRootState;

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

        const failedAccount =
            outcome === 'complete' ? selectFailedDeviceAccount(getState()) : undefined;
        const failure = status.status === 'failed' ? status : failedAccount;
        const reportedOutcome = failure === undefined ? outcome : 'failed';

        // Discovery keeps a run cancelled on the device as failed, so that it can be retried.
        // `Method_Cancel` stays a failure: it also comes from other features cancelling every Connect call.
        const isCancelledFailure =
            failure?.errorCode !== undefined &&
            DEVICE_CANCELLATION_ERROR_CODES.includes(failure.errorCode);
        const errorCode =
            failure !== undefined && !isCancelledFailure
                ? getReportableErrorCode(failure.errorCode)
                : undefined;

        extra.services.analytics.report({
            type: events.accountsDiscoveryResultEvent.name,
            payload: {
                outcome: isCancelledFailure ? 'cancelled' : reportedOutcome,
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
