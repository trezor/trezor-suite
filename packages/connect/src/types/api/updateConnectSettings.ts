/**
 * Update Connect settings such as proxy and transports configuration.
 */

import type { SerializedError } from '@trezor/connect-common/src/constants/errors';
import type { Err, Ok } from '@trezor/type-utils';

import type { ConnectSettingsTransport, Proxy } from '../settings';

export type UpdateConnectSettings = {
    proxy?: Proxy;
    transports?: ConnectSettingsTransport[];
};

export declare function updateConnectSettings(
    params: UpdateConnectSettings,
): Promise<Ok<{ message: 'success' }> | Err<SerializedError>>;
