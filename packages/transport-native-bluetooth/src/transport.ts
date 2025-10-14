import { AbstractApiTransport, Transport as AbstractTransport } from '@trezor/transport';

import { BluetoothApi } from './api/BluetoothApi';

export class NativeBluetoothTransport extends AbstractApiTransport {
    public name = 'NativeBluetoothTransport' as const;

    constructor(params: ConstructorParameters<typeof AbstractTransport>[0]) {
        const { logger, ...rest } = params;

        const api = new BluetoothApi({
            logger:
                process.env.EXPO_PUBLIC_IS_NATIVE_BLUETOOTH_LOGGER_ENABLED === 'true'
                    ? console
                    : logger,
        });

        super({ api, ...rest });
    }
}
