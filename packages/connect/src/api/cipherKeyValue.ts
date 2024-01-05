// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/CipherKeyValue.js

import { UI, createUiMessage } from '../events';
import { AbstractMethod } from '../core/AbstractMethod';
import { getFirmwareRange } from './common/paramsValidator';
import { validatePath } from '../utils/pathUtils';
import type { PROTO } from '../constants';
import { Assert } from '@trezor/schema-utils';
import { Bundle } from '../types/params';
import { CipherKeyValue as CipherKeyValueSchema } from '../types/api/cipherKeyValue';

export default class CipherKeyValue extends AbstractMethod<
    'cipherKeyValue',
    PROTO.CipherKeyValue[]
> {
    hasBundle?: boolean;

    init() {
        this.requiredPermissions = ['read', 'write'];
        this.firmwareRange = getFirmwareRange(this.name, null, this.firmwareRange);

        // create a bundle with only one batch if bundle doesn't exists
        this.hasBundle = !!this.payload.bundle;
        const payload = !this.payload.bundle
            ? { ...this.payload, bundle: [this.payload] }
            : this.payload;

        this.useEmptyPassphrase =
            typeof payload.useEmptyPassphrase === 'boolean' ? payload.useEmptyPassphrase : true;

        // validate bundle type
        Assert(Bundle(CipherKeyValueSchema), payload);
        this.params = payload.bundle.map(batch => ({
            address_n: validatePath(batch.path),
            key: batch.key,
            value: batch.value instanceof Buffer ? batch.value.toString('hex') : batch.value,
            encrypt: batch.encrypt,
            ask_on_encrypt: batch.askOnEncrypt,
            ask_on_decrypt: batch.askOnDecrypt,
            iv: batch.iv instanceof Buffer ? batch.iv.toString('hex') : batch.iv,
        }));
    }

    get info() {
        return 'Cipher key value';
    }

    async run() {
        const responses: PROTO.CipheredKeyValue[] = [];
        const cmd = this.device.getCommands();
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
                    createUiMessage(UI.BUNDLE_PROGRESS, {
                        progress: i,
                        response,
                    }),
                );
            }
        }
        return this.hasBundle ? responses : responses[0];
    }
}
