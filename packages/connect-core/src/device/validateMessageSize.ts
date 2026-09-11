import { TypedError } from '@trezor/connect-common/src/constants/errors';

import type { Device } from './Device';

/**
 * for T1B1 maximum message size is 1024 bytes
 */
export const validateModelOneMessageSize = (device: Device, messageHex: string) => {
    if (device.features?.major_version === 1) {
        const byteSize = messageHex.length / 2;
        if (byteSize > 1024) {
            throw TypedError('Method_DataOverflowModelOne');
        }
    }
};
