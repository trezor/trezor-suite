import { AbstractTransportParams } from './abstract';

import { UdpApi } from '../api/udp';
import { AbstractApiTransport } from './abstractApi';

import { SessionsClient } from '../sessions/client';
import { SessionsBackground } from '../sessions/background';

export class UdpTransport extends AbstractApiTransport {
    public name = 'UdpTransport' as const;
    private enumerateTimeout: ReturnType<typeof setTimeout> | undefined;

    constructor(params: AbstractTransportParams) {
        const { messages, logger, signal, debugLink } = params;
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
            api: new UdpApi({ logger, debugLink }),
            logger,
            sessionsClient,
            signal,
        });
    }

    public listen() {
        this.api.listen();

        return super.listen();
    }

    public stop() {
        if (this.enumerateTimeout) {
            clearTimeout(this.enumerateTimeout);
            this.enumerateTimeout = undefined;
        }

        return super.stop();
    }
}
