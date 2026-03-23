// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/CipherKeyValue.js

import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage, MethodPermission } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { UI_REQUEST, createUiMessage } from '../events';
import { getFirmwareRange } from './common/paramsValidator';
import { CipherKeyValue as CipherKeyValueSchema } from '../types/api/cipherKeyValue';
import { Bundle } from '../types/params';
import { validatePath } from '../utils/pathUtils';

export default class CipherKeyValue extends AbstractMethod<
    'cipherKeyValue',
    PROTO.CipherKeyValue[]
> {
    hasBundle?: boolean;

    constructor(message: MethodMessage<'cipherKeyValue'>) {
        super(message);
        this.firmwareRange = getFirmwareRange(this.name, null, this.firmwareRange);
    }
    get requiredPermissions(): MethodPermission[] {
        return ['read', 'write'];
    }

    init() {
        // create a bundle with only one batch if bundle doesn't exists
        this.hasBundle = !!this.payload.bundle;
        const payload = !this.payload.bundle
            ? { ...this.payload, bundle: [this.payload] }
            : this.payload;

        // validate bundle type
        Assert(Bundle(CipherKeyValueSchema), payload);
        this.params = payload.bundle.map(batch => ({
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
    }

    get info() {
        return 'Cipher key value';
    }

    async run() {
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
                this.postMessage(
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
