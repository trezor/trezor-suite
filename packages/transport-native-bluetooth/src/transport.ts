import { UnifiedTransport } from '@trezor/transport';

import { BluetoothApi } from './api/BluetoothApi';
import { UnifiedTransportParams } from '@trezor/transport/src/transports/unified';

export class NativeBluetoothTransport extends UnifiedTransport {
    // Note: name is 'UnifiedTransport' from parent class

    constructor(params: Omit<UnifiedTransportParams, 'apis'>) {
        const { logger, ...rest } = params;

        const api = new BluetoothApi({
            logger:
                process.env.EXPO_PUBLIC_IS_NATIVE_BLUETOOTH_LOGGER_ENABLED === 'true'
                    ? console
                    : logger,
        });
        api.on('trezor-push-notification', event => {
            this.emit('trezor-push-notification', event);
        });
        api.on('battery-level', event => {
            this.emit('battery-level', event);
        });

        super({ ...rest, apis: [api], logger });
    }
}
