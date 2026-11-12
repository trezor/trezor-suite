import type { CallMethodPayload } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common';
import type { Response } from '@trezor/connect-common/src/types/params';

import type { MethodMessage, Payload } from '../../core/AbstractMethod';
import { AbstractMethod } from '../../core/AbstractMethod';

/** A method served by TrezorBlockchain until the blockchain methods leave Connect. */
export abstract class AbstractBlockchainMethod<
    Name extends CallMethodPayload['method'],
    Params,
> extends AbstractMethod<Name, Params> {
    protected readonly payload: Payload<Name>;

    constructor(message: MethodMessage<Name>, params: Params) {
        super(message, params);
        this.payload = message.payload;
        this.useDevice = false;
    }

    protected async callBlockchain<T>(response: Response<T>) {
        const result = await response;
        if (!result.success) {
            throw ERRORS.TypedError(result.error.code, result.error.message);
        }

        return result.payload;
    }
}
