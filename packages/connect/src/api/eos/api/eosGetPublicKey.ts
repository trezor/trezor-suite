// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/EosGetPublicKey.js

import { AbstractMethod, MethodReturnType } from '../../../core/AbstractMethod';
import { getFirmwareRange } from '../../common/paramsValidator';
import { getMiscNetwork } from '../../../data/coinInfo';
import { validatePath, fromHardened, getSerializedPath } from '../../../utils/pathUtils';
import { UI, createUiMessage } from '../../../events';
import type { PROTO } from '../../../constants';
import { Assert } from '@trezor/schema-utils';
import { Bundle, GetPublicKey as GetPublicKeySchema } from '../../../types';

export default class EosGetPublicKey extends AbstractMethod<
    'eosGetPublicKey',
    PROTO.EosGetPublicKey[]
> {
    hasBundle?: boolean;

    init() {
        this.requiredPermissions = ['read'];
        this.requiredDeviceCapabilities = ['Capability_EOS'];
        this.firmwareRange = getFirmwareRange(this.name, getMiscNetwork('EOS'), this.firmwareRange);

        // create a bundle with only one batch if bundle doesn't exists
        this.hasBundle = !!this.payload.bundle;
        const payload = !this.payload.bundle
            ? { ...this.payload, bundle: [this.payload] }
            : this.payload;

        // validate bundle type
        Assert(Bundle(GetPublicKeySchema), payload);

        this.params = payload.bundle.map(batch => {
            const path = validatePath(batch.path, 3);

            return {
                address_n: path,
                show_display: typeof batch.showOnTrezor === 'boolean' ? batch.showOnTrezor : false,
                chunkify: typeof batch.chunkify === 'boolean' ? batch.chunkify : false,
            };
        });
    }

    get info() {
        return 'Export Eos public key';
    }

    get confirmation() {
        return {
            view: 'export-address' as const,
            label:
                this.params.length > 1
                    ? 'Export multiple Eos public keys'
                    : `Export Eos public key for account #${
                          fromHardened(this.params[0].address_n[2]) + 1
                      }`,
        };
    }

    async run() {
        const responses: MethodReturnType<typeof this.name> = [];
        const cmd = this.device.getCommands();
        for (let i = 0; i < this.params.length; i++) {
            const batch = this.params[i];
            const { message } = await cmd.typedCall('EosGetPublicKey', 'EosPublicKey', batch);
            responses.push({
                rawPublicKey: message.raw_public_key,
                wifPublicKey: message.wif_public_key,
                path: batch.address_n,
                serializedPath: getSerializedPath(batch.address_n),
            });

            if (this.hasBundle) {
                // send progress
                this.postMessage(
                    createUiMessage(UI.BUNDLE_PROGRESS, {
                        progress: i,
                        response: message,
                    }),
                );
            }
        }

        return this.hasBundle ? responses : responses[0];
    }
}
