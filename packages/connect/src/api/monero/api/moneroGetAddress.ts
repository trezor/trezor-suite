// Monero GetAddress implementation
import { ERRORS } from '@trezor/connect-common/src/constants';
import type { Address } from '@trezor/connect-common/src/types/params';
import { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { MethodMessage, MethodPermission } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { HD_HARDENED, getSerializedPath, validatePath } from '../../../utils/pathUtils';
import { bundlify, getFirmwareRange } from '../../common/paramsValidator';

type Params = {
    proto: PROTO.MoneroGetAddress;
    address?: string;
};

export default class MoneroGetAddress extends AbstractMethod<'moneroGetAddress', Params[]> {
    hasBundle?: boolean;
    progress = 0;

    constructor(message: MethodMessage<'moneroGetAddress'>) {
        super(message);
        this.confirmMissingBackup = true;
        this.requiredDeviceCapabilities = ['Capability_Monero'];
        this.firmwareRange = getFirmwareRange(
            this.name,
            getMiscNetwork('Monero'),
            this.firmwareRange,
        );
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    init() {
        const { hasBundle, payload } = bundlify(this.payload);
        this.hasBundle = hasBundle;

        // validate bundle type and map to Monero-specific params
        const bundle = payload.bundle.map(batch => {
            // path is m/44'/128'/0' (3 components)
            // account and minor are passed as separate parameters
            const path = validatePath(batch.path, 3);

            // require all path components to be hardened
            const allHardened = path.every(component => (component & HD_HARDENED) !== 0);
            if (!allHardened) {
                throw ERRORS.TypedError(
                    'Method_InvalidParameter',
                    `Monero requires all path components to be hardened. Use m/44'/128'/0' format.`,
                );
            }

            const proto = {
                address_n: path,
                show_display: typeof batch.showOnTrezor === 'boolean' ? batch.showOnTrezor : true,
                network_type: batch.networkType || PROTO.MoneroNetworkType.MAINNET,
                account: batch.account,
                minor: batch.minor,
                payment_id: batch.paymentId,
                chunkify: typeof batch.chunkify === 'boolean' ? batch.chunkify : false,
            };

            return { proto, address: batch.address };
        });

        this.params = bundle;
        this.useUi = this.getUseUi(this.params);
    }

    get info() {
        return 'Export Monero address';
    }

    getButtonRequestData(code: string) {
        if (code === 'ButtonRequest_Address') {
            const { proto, address } = this.params[this.progress];

            return {
                type: 'address' as const,
                serializedPath: getSerializedPath(proto.address_n),
                address: address || 'not-set',
            };
        }
    }

    get confirmation() {
        return {
            view: 'export-address' as const,
            label: this.info,
        };
    }

    async _call({ proto }: Params) {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('MoneroGetAddress', 'MoneroAddress', proto);

        // The device returns address as hex-encoded bytes, decode it to string
        const addressHex = response.message.address;
        const addressBytes = Buffer.from(addressHex, 'hex');
        const address = addressBytes.toString('utf8');

        return { address };
    }

    async run() {
        const responses: Address[] = [];

        for (let i = 0; i < this.params.length; i++) {
            const batch = this.params[i];
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
                    batch.address = silent.address;
                }
            }

            const response = await this._call(batch);
            responses.push({
                address: response.address,
                path: batch.proto.address_n,
                serializedPath: getSerializedPath(batch.proto.address_n),
            });

            this.progress++;
        }

        return this.hasBundle ? responses : responses[0];
    }
}
