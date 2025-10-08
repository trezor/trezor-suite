// Monero GetAddress implementation

import { ERRORS, PROTO } from '../../../constants';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { MoneroGetAddress as MoneroGetAddressParams } from '../../../types/api/monero';
import { Address } from '../../../types/params';
import { HD_HARDENED, getSerializedPath, validatePath } from '../../../utils/pathUtils';
import { getFirmwareRange } from '../../common/paramsValidator';

type Params = PROTO.MoneroGetAddress & {
    address?: string;
};

export default class MoneroGetAddress extends AbstractMethod<'getAddress', Params[]> {
    hasBundle?: boolean;
    progress = 0;

    init() {
        this.noBackupConfirmationMode = 'always';
        this.requiredPermissions = ['read'];
        this.requiredDeviceCapabilities = ['Capability_Monero'];
        this.firmwareRange = getFirmwareRange(
            this.name,
            getMiscNetwork('Monero'),
            this.firmwareRange,
        );

        // create a bundle with only one batch if bundle doesn't exists
        this.hasBundle = !!this.payload.bundle;
        const payload = !this.payload.bundle
            ? { ...this.payload, bundle: [this.payload] }
            : this.payload;

        // validate bundle type and map to Monero-specific params
        const bundle = (payload.bundle as MoneroGetAddressParams[]).map(batch => {
            // Monero path is m/44'/128'/0' (3 components)
            // account and minor are passed as separate parameters
            const path = validatePath(batch.path, 3);

            // Monero uses Ed25519 and requires ALL path components to be hardened
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

        const useEventListener =
            payload.useEventListener &&
            this.params.length === 1 &&
            typeof this.params[0].address === 'string' &&
            this.params[0].show_display;
        this.useUi = !useEventListener;
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
        const cmd = this.device.getCommands();
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
            const response = await this._call(this.params[i]);
            responses.push({
                address: response.address,
                path: this.params[i].address_n,
                serializedPath: getSerializedPath(this.params[i].address_n),
            });

            this.progress++;
        }

        return this.hasBundle ? responses : responses[0];
    }
}
