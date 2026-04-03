import bs58 from 'bs58';

import {
    Bundle,
    GetPublicKey as GetPublicKeySchema,
    UI_REQUEST,
    createUiMessage,
} from '@trezor/connect-common';
import type { PROTO } from '@trezor/connect-common';
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

export default class SolanaGetPublicKey extends AbstractMethod<
    'solanaGetPublicKey',
    PROTO.SolanaGetPublicKey[]
> {
    hasBundle?: boolean;

    constructor(message: MethodMessage<'solanaGetPublicKey'>) {
        const { hasBundle, payload } = bundlify(message.payload);

        // validate bundle type
        Assert(Bundle(GetPublicKeySchema), payload);

        const params = payload.bundle.map(batch => {
            const path = validatePath(batch.path, 2);

            return {
                address_n: path,
                show_display: typeof batch.showOnTrezor === 'boolean' ? batch.showOnTrezor : false,
            };
        });

        super(message, params);

        this.hasBundle = hasBundle;
        this.confirmMissingBackup = true;
        this.requiredDeviceCapabilities = ['Capability_Solana'];
        this.requiredFirmwareCoins = [getMiscNetwork('Solana')];
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    get info() {
        return 'Export Solana public key';
    }

    get confirmation() {
        return {
            view: 'export-xpub' as const,
            label:
                this.params.length > 1
                    ? 'Export multiple Solana public keys'
                    : `Export Solana public key for account #${
                          fromHardened(this.params[0].address_n[2]) + 1
                      }`,
        };
    }

    async run({ sendCoreMessage }: MethodContext) {
        const responses: MethodReturnType<typeof this.name> = [];
        const cmd = this.getDevice().getCommands();
        for (let i = 0; i < this.params.length; i++) {
            const batch = this.params[i];
            const { message } = await cmd.typedCall('SolanaGetPublicKey', 'SolanaPublicKey', batch);
            responses.push({
                path: batch.address_n,
                serializedPath: getSerializedPath(batch.address_n),
                publicKey: message.public_key,
                publicKeyBase58: bs58.encode(Buffer.from(message.public_key, 'hex')),
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
