import { ERRORS } from '@trezor/connect-common/src/constants';

import type { MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';

type SuiteOnlyMethodName = 'getAccountInfo' | 'pushTransaction' | 'sendTransaction';

// Trezor Suite answers these calls of a host with its own backends and send form.
export default class SuiteOnlyMethod extends AbstractMethod<SuiteOnlyMethodName> {
    constructor(message: MethodMessage<SuiteOnlyMethodName>) {
        super(message, undefined);
        this.useDevice = false;
    }

    run() {
        return Promise.reject(
            ERRORS.TypedError(
                'Method_NotAllowed',
                `${this.name} is available only through Trezor Suite`,
            ),
        );
    }
}
