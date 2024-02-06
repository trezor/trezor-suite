import {
    Transport as AbstractTransport,
    AbstractApiTransport,
    SessionsClient,
    SessionsBackground,
} from '@trezor/transport';

import { BluetoothApi } from './bluetooth-api';

export class BluetoothTransport extends AbstractApiTransport {
    public name = 'WebUsbTransport' as const;
    private wsApi: BluetoothApi;
    // private session: SessionsClient;

    constructor(params?: ConstructorParameters<typeof AbstractTransport>[0]) {
        const { messages, logger } = params || {};
        const abortController = new AbortController();
        const sessionsBackground = new SessionsBackground({ signal: abortController.signal });

        const sessionsClient = new SessionsClient({
            requestFn: args => sessionsBackground.handleMessage(args),
            registerBackgroundCallbacks: () => {},
        });

        sessionsBackground.on('descriptors', descriptors => {
            sessionsClient.emit('descriptors', descriptors);
        });

        const api = new BluetoothApi({ logger }) as any;

        super({
            messages,
            api,
            sessionsClient,
            signal: abortController.signal,
        });

        this.wsApi = api;
    }

    public init() {
        return this.scheduleAction(async () => {
            await this.wsApi.init();
            await super.init().promise;

            return this.success(undefined);
        });
    }
}
