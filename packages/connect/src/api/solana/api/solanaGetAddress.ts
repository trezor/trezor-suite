import { Assert } from '@trezor/schema-utils';

import { ERRORS, PROTO } from '../../../constants';
import { AbstractMethod, MethodReturnType } from '../../../core/AbstractMethod';
import { getFirmwareRange } from '../../common/paramsValidator';
import { getMiscNetwork } from '../../../data/coinInfo';
import { validatePath, fromHardened, getSerializedPath } from '../../../utils/pathUtils';
import { UI, createUiMessage } from '../../../events';
import { Bundle } from '../../../types';
import { GetAddress as GetAddressSchema } from '../../../types/api/getAddress';

type Params = PROTO.SolanaGetAddress & {
    address?: string;
};

export default class SolanaGetAddress extends AbstractMethod<'solanaGetAddress', Params[]> {
    hasBundle?: boolean;
    progress = 0;

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
        Assert(Bundle(GetAddressSchema), payload);

        this.params = payload.bundle.map(batch => {
            const path = validatePath(batch.path, 2);

            return {
                address_n: path,
                address: batch.address,
                show_display: typeof batch.showOnTrezor === 'boolean' ? batch.showOnTrezor : true,
                chunkify: typeof batch.chunkify === 'boolean' ? batch.chunkify : false,
            };
        });

        const useEventListener =
            payload.useEventListener &&
            this.params.length === 1 &&
            typeof this.params[0].address === 'string' &&
            this.params[0].show_display;
        this.useUi = !useEventListener;
    }

    get info() {
        if (this.params.length === 1) {
            return 'Export Solana address';
        }

        return 'Export multiple Solana addresses';
    }

    getButtonRequestData(code: string) {
        if (code === 'ButtonRequest_Address') {
            return {
                type: 'address' as const,
                serializedPath: getSerializedPath(this.params[this.progress].address_n),
                address: this.params[this.progress].address || 'not-set',
            };
        }
    }

    get confirmation() {
        return {
            view: 'export-address' as const,
            label:
                this.params.length > 1
                    ? 'Export multiple Solana addresses'
                    : `Export Solana address for account #${
                          fromHardened(this.params[0].address_n[2]) + 1
                      }`,
        };
    }

    async _call({ address_n, show_display, chunkify }: Params) {
        const cmd = this.device.getCommands();
        const response = await cmd.typedCall('SolanaGetAddress', 'SolanaAddress', {
            address_n,
            show_display,
            chunkify,
        });

        return response.message;
    }

    async run() {
        const responses: MethodReturnType<typeof this.name> = [];
        for (let i = 0; i < this.params.length; i++) {
            const batch = this.params[i];

            // silently get address and compare with requested address
            // or display as default inside popup
            if (batch.show_display) {
                const silent = await this._call({
                    ...batch,
                    show_display: false,
                });
                if (typeof batch.address === 'string') {
                    if (batch.address !== silent.address) {
                        throw ERRORS.TypedError('Method_AddressNotMatch');
                    }
                } else {
                    // save address for future verification in "getButtonRequestData"
                    batch.address = silent.address;
                }
            }

            const message = await this._call(batch);
            responses.push({
                path: batch.address_n,
                serializedPath: getSerializedPath(batch.address_n),
                address: message.address,
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

            this.progress++;
        }

        return this.hasBundle ? responses : responses[0];
    }
}
