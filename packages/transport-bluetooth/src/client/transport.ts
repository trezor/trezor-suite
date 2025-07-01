import { AbstractTransportParams } from '@trezor/transport/src/transports/abstract';
import { AbstractApiTransport } from '@trezor/transport/src/transports/abstractApi';

import { BluetoothApi } from './bluetooth-api';
import { TrezorBluetoothSettings } from './types';

// implementation of @trezor/transport/src/transports/abstractApi

type BluetoothTransportParams = Omit<AbstractTransportParams, 'api'> & TrezorBluetoothSettings;

export class BluetoothTransport extends AbstractApiTransport {
    public name = 'BluetoothTransport' as const;
    public apiType = 'bluetooth' as const;
    private wsApi: BluetoothApi;

    constructor(params: BluetoothTransportParams) {
        const { url, logger, writeWithResponse, writeWithDelay, ...rest } = params;

        const api = new BluetoothApi({ url, logger, writeWithResponse, writeWithDelay });
        api.on('transport-interface-error', ({ error }) => {
            this.emit('transport-error', error);
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
