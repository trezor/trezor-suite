/**
 * Update Connect settings such as proxy and transports configuration.
 */

import type { Response } from '../params';
import type { ConnectSettingsTransport, Proxy } from '../settings';

export type UpdateConnectSettings = {
    proxy?: Proxy;
    transports?: ConnectSettingsTransport[];
};

export declare function updateConnectSettings(
    params: UpdateConnectSettings,
): Response<{ message: 'success' }>;
