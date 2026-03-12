// Monero GetWatchKey implementation
import { ERRORS } from '@trezor/connect-common/src/constants';

import { PROTO } from '../../../constants';
import { AbstractMethod, MethodContext, MethodMessage, MethodPermission } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import type { MoneroWatchKey } from '../../../types/api/monero';
import { HD_HARDENED, validatePath } from '../../../utils/pathUtils';
import { getFirmwareRange } from '../../common/paramsValidator';

type Params = PROTO.MoneroGetWatchKey & {
    address?: string;
};

export default class MoneroGetWatchKeyMethod extends AbstractMethod<'moneroGetWatchKey', Params> {
    constructor(message: MethodMessage<'moneroGetWatchKey'>, context: MethodContext) {
        super(message, context);
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
        const { payload } = this;
        const path = validatePath(payload.path, 3);

        // require all path components to be hardened
        const allHardened = path.every(component => (component & HD_HARDENED) !== 0);
        if (!allHardened) {
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                `Monero requires all path components to be hardened. Use m/44'/128'/0' format.`,
            );
        }

        this.params = {
            address_n: path,
            network_type: payload.networkType || PROTO.MoneroNetworkType.MAINNET,
        };
    }

    get info() {
        return 'Export Monero watch-only credentials';
    }

    async run(): Promise<MoneroWatchKey> {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('MoneroGetWatchKey', 'MoneroWatchKey', {
            address_n: this.params.address_n,
            network_type: this.params.network_type,
        });

        // The device returns address as hex-encoded bytes, decode it to string
        const addressHex = response.message.address;
        const addressBytes = Buffer.from(addressHex, 'hex');
        const address = addressBytes.toString('utf8');

        return {
            watch_key: response.message.watch_key,
            address,
        };
    }
}
