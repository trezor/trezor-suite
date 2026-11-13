import type { CallMethodPayload } from '@trezor/connect-common';

import type { MethodMessage, Payload } from '../../core/AbstractMethod';
import { AbstractMethod } from '../../core/AbstractMethod';

/** A method served by the backends until the blockchain methods leave Connect. */
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
}
