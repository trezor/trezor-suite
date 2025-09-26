import { AbstractApiTransport, Transport as AbstractTransport } from '@trezor/transport';

import { BluetoothApi } from './api/BluetoothApi';

export class NativeBluetoothTransport extends AbstractApiTransport {
    public name = 'NativeBluetoothTransport' as any;
    public apiType = 'bluetooth' as const;

    constructor(params: ConstructorParameters<typeof AbstractTransport>[0]) {
        const { logger, ...rest } = params;

        const api = new BluetoothApi({ logger });
        api.on('trezor-push-notification', event => {
            this.emit('trezor-push-notification', event);
        });

        super({ api, ...rest });
    }
}
