// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/TezosGetPublicKey.js

import {
    Bundle,
    GetPublicKey as GetPublicKeySchema,
    UI_REQUEST,
    createUiMessage,
} from '@trezor/connect-common';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type {
    MethodContext,
    MethodMessage,
    MethodPermission,
    MethodReturnType,
} from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { fromHardened, getSerializedPath, validatePath } from '../../../utils/pathUtils';
import { getFirmwareRange } from '../../common/paramsValidator';

export default class TezosGetPublicKey extends AbstractMethod<
    'tezosGetPublicKey',
    PROTO.TezosGetPublicKey[]
> {
    hasBundle?: boolean;

    constructor(message: MethodMessage<'tezosGetPublicKey'>) {
        super(message);
        this.requiredDeviceCapabilities = ['Capability_Tezos'];
        this.firmwareRange = getFirmwareRange(
            this.name,
            getMiscNetwork('Tezos'),
            this.firmwareRange,
        );
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    init() {
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
                show_display: typeof batch.showOnTrezor === 'boolean' ? batch.showOnTrezor : true,
                chunkify: typeof batch.chunkify === 'boolean' ? batch.chunkify : false,
            };
        });
    }

    get info() {
        return 'Export Tezos public key';
    }

    get confirmation() {
        return {
            view: 'export-address' as const,
            label:
                this.params.length > 1
                    ? 'Export multiple Tezos public keys'
                    : `Export Tezos public key for account #${
                          fromHardened(this.params[0].address_n[2]) + 1
                      }`,
        };
    }

    async run({ sendCoreMessage }: MethodContext) {
        const responses: MethodReturnType<typeof this.name> = [];
        const cmd = this.getDevice().getCommands();
        for (let i = 0; i < this.params.length; i++) {
            const batch = this.params[i];
            const { message } = await cmd.typedCall('TezosGetPublicKey', 'TezosPublicKey', batch);
            responses.push({
                path: batch.address_n,
                serializedPath: getSerializedPath(batch.address_n),
                publicKey: message.public_key,
            });

            if (this.hasBundle) {
                // send progress
                sendCoreMessage(
                    createUiMessage(UI_REQUEST.BUNDLE_PROGRESS, {
                        total: this.params.length,
                        progress: i,
                        response: message,
                    }),
                );
            }
        }

        return this.hasBundle ? responses : responses[0];
    }
}
