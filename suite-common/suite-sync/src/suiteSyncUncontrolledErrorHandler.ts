import { type AllocateOwnerQuotaErr } from '@suite-common/suite-sync-quota-manager';
import {
    type EnsureWalletSuiteSyncOnErrors,
    type SuiteSyncOtherError,
} from '@suite-common/suite-sync-types';
import { type TrezorDeviceWithState } from '@suite-common/suite-types';

/**
 * Those are all errors that may happen during the SuiteSync lifecycle outside of
 * a user-controlled flow (e.g. asynchronously in response to some websocket message).
 */
export type SuiteSyncUncontrolledError =
    | AllocateOwnerQuotaErr
    | EnsureWalletSuiteSyncOnErrors
    | SuiteSyncOtherError;

/**
 * This is External error handler. The caller of the SuiteSync (Desktop, Web, Native, ...)
 * should provide this handler and handle those errors (or delegate to end-user).
 */
export type SuiteSyncUncontrolledErrorHandlerParams = {
    error: SuiteSyncUncontrolledError;
    device: TrezorDeviceWithState | null;
};

export type SuiteSyncUncontrolledErrorHandler = ({
    error,
    device,
}: SuiteSyncUncontrolledErrorHandlerParams) => void;

export type SuiteSyncUncontrolledErrorHandlerDep = {
    suiteSyncUncontrolledErrorHandler: SuiteSyncUncontrolledErrorHandler;
};
