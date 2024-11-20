import { Assert } from '@trezor/schema-utils';

import { PROTO } from '../../../constants';
import { AbstractMethod, MethodReturnType } from '../../../core/AbstractMethod';
import { getFirmwareRange } from '../../common/paramsValidator';
import { getMiscNetwork } from '../../../data/coinInfo';
import { validatePath, fromHardened, getSerializedPath } from '../../../utils/pathUtils';
import { UI, createUiMessage } from '../../../events';
import { Bundle, GetPublicKey as GetPublicKeySchema } from '../../../types';

export default class SolanaGetPublicKey extends AbstractMethod<
    'solanaGetPublicKey',
    PROTO.SolanaGetPublicKey[]
> {
    hasBundle?: boolean;

    init() {
        this.noBackupConfirmationMode = 'always';
        this.requiredPermissions = ['read'];
        this.requiredDeviceCapabilities = ['Capability_Solana'];
        this.firmwareRange = getFirmwareRange(
            this.name,
            getMiscNetwork('Solana'),
            this.firmwareRange,
        );

        // create a bundle with only one batch if bundle doesn't exists
        this.hasBundle = !!this.payload.bundle;
        const payload = !this.payload.bundle
            ? { ...this.payload, bundle: [this.payload] }
            : this.payload;

        // validate bundle type
        Assert(Bundle(GetPublicKeySchema), payload);

        this.params = payload.bundle.map(batch => {
            const path = validatePath(batch.path, 2);

            return {
                address_n: path,
                show_display: typeof batch.showOnTrezor === 'boolean' ? batch.showOnTrezor : false,
            };
        });
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

    async run() {
        const responses: MethodReturnType<typeof this.name> = [];
        const cmd = this.device.getCommands();
        for (let i = 0; i < this.params.length; i++) {
            const batch = this.params[i];
            const { message } = await cmd.typedCall('SolanaGetPublicKey', 'SolanaPublicKey', batch);
            responses.push({
                path: batch.address_n,
                serializedPath: getSerializedPath(batch.address_n),
                publicKey: message.public_key,
            });

            if (this.hasBundle) {
                // send progress
                this.postMessage(
                    createUiMessage(UI.BUNDLE_PROGRESS, {
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
