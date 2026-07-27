import type { UiRequestConfirmation } from '../events/ui-request';
import type { PrecomposeResultFinal } from './api/bitcoin/composeTransaction';

/**
 * Permission category requested by a `@trezor/connect` method.
 *
 * Methods declare which permissions they require via
 * `AbstractMethod.requiredPermissions`. The connect popup groups requested
 * permissions by coin and asks the user to grant access to a host. Read scopes
 * are intentionally narrow so that, for example, granting `read_address` does
 * not also grant `read_xpub`.
 */
export type MethodPermission =
    | 'read_address'
    | 'read_xpub'
    | 'read_account_info'
    | 'read_settings'
    | 'read_features'
    | 'sign'
    | 'sign_message'
    | 'verify_message'
    | 'management'
    | 'internal'
    | 'push_tx';

/**
 * A single permission request scoped (optionally) to a specific coin.
 *
 * `coin` is `coinInfo.shortcut` (e.g. `btc`, `eth`, `ltc`, `sol`, `ada`) when
 * the underlying method targets a coin; it is left `undefined` for coin-less
 * permissions such as `read_features` or `management`.
 */
export type PermissionRequest = {
    permission: MethodPermission;
    coin?: string;
};

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
    requiredPermissions: PermissionRequest[];
    // Available after init.
    info: string;
    precomposed?: PrecomposeResultFinal;
    confirmation?: UiRequestConfirmation['payload'];
};
