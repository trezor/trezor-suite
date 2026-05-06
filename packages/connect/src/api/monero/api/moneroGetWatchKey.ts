// Monero GetWatchKey implementation
import type { MethodPermission, MoneroWatchKey } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { HD_HARDENED, validatePath } from '../../../utils/pathUtils';

type Params = {
    proto: PROTO.MoneroGetWatchKey;
};

export default class MoneroGetWatchKeyMethod extends AbstractMethod<'moneroGetWatchKey', Params> {
    constructor(message: MethodMessage<'moneroGetWatchKey'>) {
        const { payload } = message;
        const path = validatePath(payload.path, 3);

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
            network_type: payload.networkType || PROTO.MoneroNetworkType.MAINNET,
        };
        const params = { proto };

        super(message, params);

        this.requiredDeviceCapabilities = ['Capability_Monero'];
        this.requiredFirmwareCoins = [getMiscNetwork('Monero')];
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    get info() {
        return 'Export Monero watch-only credentials';
    }

    async run(): Promise<MoneroWatchKey> {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall(
            'MoneroGetWatchKey',
            'MoneroWatchKey',
            this.params.proto,
        );

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
