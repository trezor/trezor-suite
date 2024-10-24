import { Transport as AbstractTransport, AbstractApiTransport } from '@trezor/transport';

import { BluetoothApi } from './bluetooth-api';

export class BluetoothTransport extends AbstractApiTransport {
    public name = 'WebUsbTransport' as const;
    private wsApi: BluetoothApi;
    // private session: SessionsClient;

    constructor(params?: ConstructorParameters<typeof AbstractTransport>[0]) {
        const { messages, logger } = params || {};

        const api = new BluetoothApi({ logger }) as any;

        super({
            messages,
            api,
        });

        this.wsApi = api;
    }

    public init() {
        return this.scheduleAction(async () => {
            await this.wsApi.init();
            await super.init();

            return this.success(undefined);
        });
    }
}
