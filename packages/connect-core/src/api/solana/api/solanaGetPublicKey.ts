import { base58 } from '@scure/base';

import {
    Bundle,
    GetPublicKey as GetPublicKeySchema,
    UI_EVENTS,
    createUiEventMessage,
} from '@trezor/connect-common';
import type { PROTO, PermissionRequest } from '@trezor/connect-common';
import { fromHardenedPathPart } from '@trezor/crypto-utils';
import { Assert } from '@trezor/schema-utils';

import type { MethodContext, MethodMessage, MethodReturnType } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { getSerializedPath, validatePath } from '../../../utils/pathUtils';
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
        this.requiredFirmwareCoins = [getMiscNetwork('sol')];
    }

    get requiredPermissions(): PermissionRequest[] {
        return this.coinPerms('read_xpub', this.requiredFirmwareCoins);
    }

    get info() {
        return 'Export Solana public key';
    }

    get confirmation() {
        if (this.params.length > 1) {
            return {
                view: 'export-xpub' as const,
                label: 'Export multiple Solana public keys',
            };
        }
        const { params } = this;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const first: (typeof params)[number] = params[0];
        const addressN = first.address_n;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const accountIndex: number = addressN[2];

        return {
            view: 'export-xpub' as const,
            label: `Export Solana public key for account #${fromHardenedPathPart(accountIndex) + 1}`,
        };
    }

    async run({ sendCoreMessage }: MethodContext) {
        const responses: MethodReturnType<typeof this.name> = [];
        const cmd = this.getDevice().getCommands();
        for (let i = 0; i < this.params.length; i++) {
            const { params } = this;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const batch: (typeof params)[number] = params[i];
            const { message } = await cmd.typedCall('SolanaGetPublicKey', 'SolanaPublicKey', batch);
            const publicKeyBase58 = base58.encode(Buffer.from(message.public_key, 'hex'));
            responses.push({
                path: batch.address_n,
                serializedPath: getSerializedPath(batch.address_n),
                publicKey: message.public_key,
                publicKeyBase58,
                displayablePublicKey: publicKeyBase58,
            });

            if (this.hasBundle) {
                // send progress
                sendCoreMessage(
                    createUiEventMessage(UI_EVENTS.BUNDLE_PROGRESS, {
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
