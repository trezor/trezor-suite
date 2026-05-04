import { AbstractApiTransport, type AbstractTransportParams } from '@trezor/transport-abstract';

import { BluetoothApi } from './bluetooth-api';
import { type TrezorBluetoothSettings } from './types';

// implementation of @trezor/transport/src/transports/abstractApi

type BluetoothTransportParams = Omit<AbstractTransportParams, 'api'> & TrezorBluetoothSettings;

export class BluetoothTransport extends AbstractApiTransport {
    public name = 'BluetoothTransport' as const;
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
            api,
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
