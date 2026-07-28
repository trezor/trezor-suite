/**
 * Update Connect settings such as proxy, transports, and WARD data provider configuration.
 */

import type { AuthLabelProvider as WardDataProvider } from '@trezor/ward';

import type { Response } from '../params';
import type { ConnectSettingsTransport, Proxy } from '../settings';

export type UpdateConnectSettings = {
    proxy?: Proxy;
    transports?: ConnectSettingsTransport[];
    wardDataProvider?: WardDataProvider;
};

export declare function updateConnectSettings(
    params: UpdateConnectSettings,
): Response<{ message: 'success' }>;
