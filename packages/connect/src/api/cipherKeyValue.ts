// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/CipherKeyValue.js

import {
    CipherKeyValue as CipherKeyValueSchema,
    UI_REQUEST,
    createUiMessage,
} from '@trezor/connect-common';
import { Bundle } from '@trezor/connect-common/src/types/params';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodContext, MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { bundlify } from './common/paramsValidator';
import { validatePath } from '../utils/pathUtils';

export default class CipherKeyValue extends AbstractMethod<
    'cipherKeyValue',
    PROTO.CipherKeyValue[]
> {
    hasBundle?: boolean;

    constructor(message: MethodMessage<'cipherKeyValue'>) {
        const { hasBundle, payload } = bundlify(message.payload);

        // validate bundle type
        Assert(Bundle(CipherKeyValueSchema), payload);
        const params = payload.bundle.map(batch => ({
            address_n: validatePath(batch.path),
            key: batch.key,
            value:
                batch.value instanceof Buffer
                    ? batch.value.toString('hex')
                    : (batch.value as string),
            encrypt: batch.encrypt,
            ask_on_encrypt: batch.askOnEncrypt,
            ask_on_decrypt: batch.askOnDecrypt,
            iv: batch.iv instanceof Buffer ? batch.iv.toString('hex') : (batch.iv as string),
        }));

        super(message, params);
        this.hasBundle = hasBundle;
    }
    get requiredPermissions(): MethodPermission[] {
        return ['read', 'write'];
    }

    get info() {
        return 'Cipher key value';
    }

    async run({ sendCoreMessage }: MethodContext) {
        const responses: PROTO.CipheredKeyValue[] = [];
        const cmd = this.getDevice().getCommands();
        for (let i = 0; i < this.params.length; i++) {
            const response = await cmd.typedCall(
                'CipherKeyValue',
                'CipheredKeyValue',
                this.params[i],
            );
            responses.push(response.message);

            if (this.hasBundle) {
                // send progress
                sendCoreMessage(
                    createUiMessage(UI_REQUEST.BUNDLE_PROGRESS, {
                        total: this.params.length,
                        progress: i,
                        response,
                    }),
                );
            }
        }

        return this.hasBundle ? responses : responses[0];
    }
}
