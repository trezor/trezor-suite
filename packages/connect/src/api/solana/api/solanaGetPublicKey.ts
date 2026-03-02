import bs58 from 'bs58';

import { Assert } from '@trezor/schema-utils';

import { PROTO } from '../../../constants';
import {
    AbstractMethod,
    MethodPermission,
    MethodReturnType,
    Payload,
} from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import type { Device } from '../../../device/Device';
import { UI_REQUEST, createUiMessage } from '../../../events';
import { Bundle, GetPublicKey as GetPublicKeySchema } from '../../../types';
import { fromHardened, getSerializedPath, validatePath } from '../../../utils/pathUtils';
import { getFirmwareRange } from '../../common/paramsValidator';

export default class SolanaGetPublicKey extends AbstractMethod<
    'solanaGetPublicKey',
    PROTO.SolanaGetPublicKey[]
> {
    hasBundle?: boolean;

    constructor(message: { id?: number; payload: Payload<'solanaGetPublicKey'> }) {
        super(message);
        this.confirmMissingBackup = true;
        this.requiredDeviceCapabilities = ['Capability_Solana'];
        this.firmwareRange = getFirmwareRange(
            this.name,
            getMiscNetwork('Solana'),
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

    async run(device: Device) {
        const responses: MethodReturnType<typeof this.name> = [];
        const cmd = device.getCommands();
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
                this.postMessage(
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
