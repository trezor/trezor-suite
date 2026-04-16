import {
    Bundle,
    GetAddress as GetAddressSchema,
    UI_REQUEST,
    createUiMessage,
} from '@trezor/connect-common';
import type { PROTO } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
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

type Params = {
    proto: PROTO.SolanaGetAddress;
    address?: string;
};

export default class SolanaGetAddress extends AbstractMethod<'solanaGetAddress', Params[]> {
    hasBundle?: boolean;
    progress = 0;

    constructor(message: MethodMessage<'solanaGetAddress'>) {
        const { hasBundle, payload } = bundlify(message.payload);

        // validate bundle type
        Assert(Bundle(GetAddressSchema), payload);

        const params = payload.bundle.map(batch => {
            const path = validatePath(batch.path, 2);

            const proto = {
                address_n: path,
                show_display: typeof batch.showOnTrezor === 'boolean' ? batch.showOnTrezor : true,
                chunkify: typeof batch.chunkify === 'boolean' ? batch.chunkify : false,
            };

            return { proto, address: batch.address };
        });

        super(message, params);
        this.hasBundle = hasBundle;
        this.useUi = this.getUseUi(this.params, payload.useEventListener);
        this.confirmMissingBackup = true;
        this.requiredDeviceCapabilities = ['Capability_Solana'];
        this.requiredFirmwareCoins = [getMiscNetwork('Solana')];
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    get info() {
        if (this.params.length === 1) {
            return 'Export Solana address';
        }

        return 'Export multiple Solana addresses';
    }

    getButtonRequestData(code: string) {
        if (code === 'ButtonRequest_Address') {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const current: (typeof this.params)[number] = this.params[this.progress];

            return {
                type: 'address' as const,
                serializedPath: getSerializedPath(current.proto.address_n),
                address: current.address || 'not-set',
            };
        }
    }

    get confirmation() {
        if (this.params.length > 1) {
            return {
                view: 'export-address' as const,
                label: 'Export multiple Solana addresses',
            };
        }
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const first: (typeof this.params)[number] = this.params[0];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const accountIndex: number = first.proto.address_n[2];

        return {
            view: 'export-address' as const,
            label: `Export Solana address for account #${fromHardened(accountIndex) + 1}`,
        };
    }

    async _call({ proto }: Params) {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('SolanaGetAddress', 'SolanaAddress', proto);

        return response.message;
    }

    async run({ sendCoreMessage }: MethodContext) {
        const responses: MethodReturnType<typeof this.name> = [];
        for (let i = 0; i < this.params.length; i++) {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const batch: (typeof this.params)[number] = this.params[i];

            // silently get address and compare with requested address
            // or display as default inside popup
            if (batch.proto.show_display) {
                const silent = await this._call({
                    ...batch,
                    proto: { ...batch.proto, show_display: false },
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
                path: batch.proto.address_n,
                serializedPath: getSerializedPath(batch.proto.address_n),
                address: message.address,
                mac: message.mac,
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

            this.progress++;
        }

        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const first: (typeof responses)[number] = responses[0];

        return this.hasBundle ? responses : first;
    }
}
