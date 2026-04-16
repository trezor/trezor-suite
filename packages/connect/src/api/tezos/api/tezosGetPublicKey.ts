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
import { bundlify } from '../../common/paramsValidator';

export default class TezosGetPublicKey extends AbstractMethod<
    'tezosGetPublicKey',
    PROTO.TezosGetPublicKey[]
> {
    hasBundle?: boolean;

    constructor(message: MethodMessage<'tezosGetPublicKey'>) {
        const { hasBundle, payload } = bundlify(message.payload);

        // validate bundle type
        Assert(Bundle(GetPublicKeySchema), payload);

        const params = payload.bundle.map(batch => {
            const path = validatePath(batch.path, 3);

            return {
                address_n: path,
                show_display: typeof batch.showOnTrezor === 'boolean' ? batch.showOnTrezor : true,
                chunkify: typeof batch.chunkify === 'boolean' ? batch.chunkify : false,
            };
        });

        super(message, params);

        this.hasBundle = hasBundle;
        this.requiredDeviceCapabilities = ['Capability_Tezos'];
        this.requiredFirmwareCoins = [getMiscNetwork('Tezos')];
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    init() {}

    get info() {
        return 'Export Tezos public key';
    }

    get confirmation() {
        if (this.params.length > 1) {
            return {
                view: 'export-address' as const,
                label: 'Export multiple Tezos public keys',
            };
        }
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const first: (typeof this.params)[number] = this.params[0];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const accountIndex: number = first.address_n[2];

        return {
            view: 'export-address' as const,
            label: `Export Tezos public key for account #${fromHardened(accountIndex) + 1}`,
        };
    }

    async run({ sendCoreMessage }: MethodContext) {
        const responses: MethodReturnType<typeof this.name> = [];
        const cmd = this.getDevice().getCommands();
        for (let i = 0; i < this.params.length; i++) {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const batch: (typeof this.params)[number] = this.params[i];
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

        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const first: (typeof responses)[number] = responses[0];

        return this.hasBundle ? responses : first;
    }
}
