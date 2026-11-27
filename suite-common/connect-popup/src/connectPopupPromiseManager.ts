import { type Deferred, createDeferred } from '@trezor/utils';

import { type SelectFeeChoice } from './connectPopupTypes';

type PermissionDeferred = Deferred<SelectFeeChoice | void>;

let permissionDeferred: PermissionDeferred | undefined;

/**
 * Deferred for the permission request and the following user interactions of the call. There is
 * only one, because only one popup call runs at a time (see connectPopupCallQueue).
 */
export const getPermissionDeferred = (clear: boolean = false): PermissionDeferred => {
    if (!permissionDeferred || clear) {
        const deferred: PermissionDeferred = createDeferred();
        permissionDeferred = deferred;
        // Reset when the interaction is finished. Swallow here — this internal cleanup chain has no
        // consumer of its own; without the catch, a rejection (e.g. Method_Cancel) becomes an
        // unhandled promise rejection even though callers of `.promise` handle it themselves.
        deferred.promise
            .finally(() => {
                if (permissionDeferred === deferred) permissionDeferred = undefined;
            })
            .catch(() => {});
    }

    return permissionDeferred;
};
