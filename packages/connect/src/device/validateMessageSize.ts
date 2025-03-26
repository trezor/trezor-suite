import { getByteSizeOfString } from '@trezor/utils';

import { TypedError } from '../constants/errors';

/**
 * for T1B1 maximum message size is 1024 bytes
 */
export const validateModelOneMessageSize = (messageHex: string) => {
    const byteSize = getByteSizeOfString(messageHex) / 2;
    //
    if (byteSize > 1024) {
        throw TypedError('Method_DataOverflowModelOne');
    }
};
