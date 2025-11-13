import { UnifiedTransport, UnifiedTransportParams } from '@trezor/transport/src/transports/unified';

import { BluetoothApi } from './bluetooth-api';
import { TrezorBluetoothSettings } from './types';

// implementation of @trezor/transport/src/transports/unified

type BluetoothTransportParams = Omit<UnifiedTransportParams, 'apis'> & TrezorBluetoothSettings;

export class BluetoothTransport extends UnifiedTransport {
    // Note: name is 'UnifiedTransport' from parent class
    private wsApi: BluetoothApi;

    constructor(params: BluetoothTransportParams) {
        const { url, logger, writeWithResponse, writeWithDelay, ...rest } = params;

        const api = new BluetoothApi({
            url,
            logger,
            writeWithResponse,
            writeWithDelay,
        });
        api.on('transport-interface-error', ({ error }) => {
            this.emit('transport-error', error);
        });
        api.on('trezor-push-notification', event => {
            this.emit('trezor-push-notification', event);
        });
        api.on('battery-level', event => {
            this.emit('battery-level', event);
        });

        super({
            apis: [api],
            logger,
            ...rest,
        });

        this.wsApi = api;
    }

    public init({ signal }: { signal?: AbortSignal } = {}) {
        return this.scheduleAction(async () => {
            await this.wsApi.init();

            return super.init({ signal });
        });
    }
}
