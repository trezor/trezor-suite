import { Transport as AbstractTransport, AbstractApiTransport } from '@trezor/transport';

import { BluetoothApi } from './bluetooth-api';

// Reflection of @trezor/transport/src/transports
export class BluetoothTransport extends AbstractApiTransport {
    public name = 'BluetoothTransport' as const;
    public apiType = 'bluetooth' as const;
    private wsApi: BluetoothApi;

    constructor(params: ConstructorParameters<typeof AbstractTransport>[0]) {
        const { logger, ...rest } = params;

        const api = new BluetoothApi({ logger });

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
