import { v1 as v1Protocol } from '@trezor/protocol';
import {
    Transport as AbstractTransport,
    AbstractApiTransport,
    SessionsClient,
    SessionsBackground,
} from '@trezor/transport';
import { AbstractTransportMethodParams } from '@trezor/transport/src/transports/abstract';

import { BluetoothApi } from './transport-api';

export class BluetoothTransport extends AbstractApiTransport {
    public name = 'WebUsbTransport' as const;
    private wsApi: BluetoothApi;
    // private session: SessionsClient;

    constructor(params?: ConstructorParameters<typeof AbstractTransport>[0]) {
        const { messages, logger } = params || {};
        const sessionsBackground = new SessionsBackground();

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

    // Override call/send encoding options, use chunkSize = 244

    private setEncodeSize(protocol = v1Protocol) {
        return {
            ...protocol,
            encode: (...[data, options]: Parameters<typeof protocol.encode>) =>
                protocol.encode(data, { ...options, chunkSize: 244 }),
        } as typeof protocol;
    }

    public call({ protocol, ...params }: AbstractTransportMethodParams<'call'>) {
        return super.call({
            ...params,
            protocol: this.setEncodeSize(protocol),
        });
    }

    public send({ protocol, ...params }: AbstractTransportMethodParams<'send'>) {
        return super.send({
            ...params,
            protocol: this.setEncodeSize(protocol),
        });
    }
}
