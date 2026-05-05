import type { UiRequestConfirmation } from '../events/ui-request';
import type { PrecomposeResultFinal } from './api/composeTransaction';

/**
 * Permission category requested by a `@trezor/connect` method.
 *
 * Methods declare which permissions they require via
 * `AbstractMethod.requiredPermissions`. The connect popup groups requested
 * permissions by category and asks the user to grant access to a host (e.g.
 * read public data, sign a transaction, manage the device, push to network).
 */
export type MethodPermission = 'read' | 'write' | 'management' | 'push_tx';

/**
 * Static and runtime metadata describing a `@trezor/connect` method call.
 *
 * Returned by `AbstractMethod.getMethodInfo()` and consumed by the connect
 * popup and host integrations to render the permission/confirmation UI and
 * decide whether a method needs the device, popup or device-state checks.
 */
export type MethodInfo = {
    // Static fields.
    useUi: boolean;
    useDevice: boolean;
    useDeviceState: boolean;
    name: string;
    requiredPermissions: MethodPermission[];
    // Available after init.
    info: string;
    precomposed?: PrecomposeResultFinal;
    confirmation?: UiRequestConfirmation['payload'];
};
