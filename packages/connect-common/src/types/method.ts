import type { UiRequestConfirmation } from '../events/ui-request';
import type { PrecomposeResultFinal } from './api/bitcoin/composeTransaction';
import type { CoinSymbol } from './coinInfo';

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
 * `coin` is the canonical, lowercase coin symbol (`CoinSymbol`, e.g. `btc`,
 * `eth`, `ada`) — the lowercased `coinInfo.shortcut` — when the underlying
 * method targets a coin; it is left `undefined` for coin-less permissions such
 * as `read_features` or `management`.
 */
export type PermissionRequest = {
    permission: MethodPermission;
    coin?: CoinSymbol;
};

/**
 * Permission categories a host/dapp may be granted up front.
 *
 * `management` and `internal` are device/host-internal scopes that are never
 * grantable to a 3rd-party app and are therefore excluded. Ordered for display.
 * This is the base allowlist; the connect popup additionally drops `push_tx` on
 * deeplink sources at sanitize time (a contextual restriction, not part of this set).
 */
export const GRANTABLE_PERMISSIONS: readonly MethodPermission[] = [
    'read_address',
    'read_xpub',
    'read_account_info',
    'read_features',
    'sign',
    'sign_message',
    'verify_message',
    'push_tx',
];

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
