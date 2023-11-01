import { v1 as v1Protocol } from '@trezor/protocol';

import { AbstractTransport, AbstractTransportMethodParams } from './abstract';
import { WebBluetoothApi } from '../api/webbluetooth';
import { AbstractApiTransport } from './abstractApi';
import { SessionsClient } from '../sessions/client';
import { SessionsBackground } from '../sessions/background';

type WebBluetoothConstructorParameters = ConstructorParameters<typeof AbstractTransport>[0] & {};

export class WebBluetoothTransport extends AbstractApiTransport {
    public name = 'WebBluetoothTransport' as const;

    constructor({ messages, logger }: WebBluetoothConstructorParameters) {
        const sessionsBackground = new SessionsBackground();

        // in udp there is no synchronization yet. it depends where this transport runs (node or browser)
        const sessionsClient = new SessionsClient({
            requestFn: args => sessionsBackground.handleMessage(args),
            registerBackgroundCallbacks: () => {},
        });

        sessionsBackground.on('descriptors', descriptors => {
            sessionsClient.emit('descriptors', descriptors);
        });

        super({
            messages,
            api: new WebBluetoothApi({ logger }),
            logger,
            sessionsClient,
        });
    }

    public init() {
        this._listen();
        return super.init();
    }

    private async _listen(): Promise<void> {
        if (this.stopped) {
            return;
        }
        const listenTimestamp = new Date().getTime();

        const response = await this.enumerate().promise;

        if (!response.success) {
            const time = new Date().getTime() - listenTimestamp;
            if (time > 1100) {
                // await createTimeoutPromise(1000);
                return this._listen();
            }
            // this.emit('transport-error', response.error);
            return;
        }

        this.handleDescriptorsChange(response.payload);

        setTimeout(() => this._listen(), 5000);
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
