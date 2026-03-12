// Monero GetAddress implementation
import { ERRORS } from '@trezor/connect-common/src/constants';

import { PROTO } from '../../../constants';
import { AbstractMethod, MethodContext, MethodMessage, MethodPermission } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { Address } from '../../../types/params';
import { HD_HARDENED, getSerializedPath, validatePath } from '../../../utils/pathUtils';
import { getFirmwareRange } from '../../common/paramsValidator';

type Params = PROTO.MoneroGetAddress & {
    address?: string;
};

export default class MoneroGetAddress extends AbstractMethod<'moneroGetAddress', Params[]> {
    hasBundle?: boolean;
    progress = 0;

    constructor(message: MethodMessage<'moneroGetAddress'>, context: MethodContext) {
        super(message, context);
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
        // create a bundle with only one batch if bundle doesn't exists
        this.hasBundle = !!this.payload.bundle;
        const payload = !this.payload.bundle
            ? { ...this.payload, bundle: [this.payload] }
            : this.payload;

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

            return {
                address_n: path,
                address: batch.address,
                show_display: typeof batch.showOnTrezor === 'boolean' ? batch.showOnTrezor : true,
                network_type: batch.networkType || PROTO.MoneroNetworkType.MAINNET,
                account: batch.account,
                minor: batch.minor,
                payment_id: batch.paymentId,
                chunkify: typeof batch.chunkify === 'boolean' ? batch.chunkify : false,
            };
        });

        this.params = bundle;
        this.useUi = this.getUseUi(this.params);
    }

    get info() {
        return 'Export Monero address';
    }

    getButtonRequestData(code: string) {
        if (code === 'ButtonRequest_Address') {
            const { address_n, address } = this.params[this.progress];

            return {
                type: 'address' as const,
                serializedPath: getSerializedPath(address_n),
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

    async _call({
        address_n,
        show_display,
        network_type,
        account,
        minor,
        payment_id,
        chunkify,
    }: Params) {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('MoneroGetAddress', 'MoneroAddress', {
            address_n,
            show_display,
            network_type,
            account,
            minor,
            payment_id,
            chunkify,
        });

        // The device returns address as hex-encoded bytes, decode it to string
        const addressHex = response.message.address;
        const addressBytes = Buffer.from(addressHex, 'hex');
        const address = addressBytes.toString('utf8');

        return {
            address,
        };
    }

    async run() {
        const responses: Address[] = [];

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
                    batch.address = silent.address;
                }
            }

            const response = await this._call(batch);
            responses.push({
                address: response.address,
                path: batch.address_n,
                serializedPath: getSerializedPath(batch.address_n),
            });

            this.progress++;
        }

        return this.hasBundle ? responses : responses[0];
    }
}
