import { AbstractTransportParams } from './abstract';

import { UdpApi } from '../api/udp';
import { AbstractApiTransport } from './abstractApi';

import { SessionsClient } from '../sessions/client';
import { SessionsBackground } from '../sessions/background';

export class UdpTransport extends AbstractApiTransport {
    public name = 'UdpTransport' as const;

    constructor(params: AbstractTransportParams) {
        const { messages, logger, signal } = params;
        const sessionsBackground = new SessionsBackground({ signal });

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
            api: new UdpApi({ logger }),
            logger,
            sessionsClient,
            signal,
        });

        const enumerateRecursive = () => {
            setTimeout(() => {
                this.enumerate().promise.finally(enumerateRecursive);
            }, 500);
        };
        enumerateRecursive();
    }
}
