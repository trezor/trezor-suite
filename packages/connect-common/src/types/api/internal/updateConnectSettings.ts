/**
 * Update Connect settings such as proxy and transports configuration.
 *
 * `enabledNetworks` is applied additively (see `ConnectSettings.enabledNetworks`).
 */

import type { Response } from '../../params';
import type { ConnectSettingsTransport, EnabledNetwork } from '../../settings';

export type UpdateConnectSettings = {
    proxy?: unknown;
    transports?: ConnectSettingsTransport[];
    enabledNetworks?: EnabledNetwork[];
};

export declare function updateConnectSettings(
    params: UpdateConnectSettings,
): Response<{ message: 'success' }>;
