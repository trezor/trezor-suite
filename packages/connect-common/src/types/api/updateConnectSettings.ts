/**
 * Update Connect settings such as proxy, transports, and AuthDB provider configuration.
 */

import type { AuthLabelProvider } from '../../authLabelProvider';
import type { Response } from '../params';
import type { ConnectSettingsTransport, Proxy } from '../settings';

export type UpdateConnectSettings = {
    proxy?: Proxy;
    transports?: ConnectSettingsTransport[];
    authLabelLookupProvider?: AuthLabelProvider;
};

export declare function updateConnectSettings(
    params: UpdateConnectSettings,
): Response<{ message: 'success' }>;
