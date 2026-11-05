/**
 * Update Connect settings such as proxy, transports and the WARD host (wardd).
 *
 * `enabledNetworks` is applied additively (see `ConnectSettings.enabledNetworks`).
 */

import type { WardRelay } from '@trezor/ward';

import type { Response } from '../../params';
import type { ConnectSettingsTransport, EnabledNetwork, Proxy } from '../../settings';

export type UpdateConnectSettings = {
    proxy?: Proxy;
    transports?: ConnectSettingsTransport[];
    enabledNetworks?: EnabledNetwork[];
    wardd?: WardRelay;
};

export declare function updateConnectSettings(
    params: UpdateConnectSettings,
): Response<{ message: 'success' }>;
