import { AbstractTransportParams } from './abstract';

import { UdpApi } from '../api/udp';
import { AbstractApiTransport } from './abstractApi';

import { SessionsBackground } from '../sessions/background';
export class UdpTransport extends AbstractApiTransport {
    public name = 'UdpTransport' as const;
    private enumerateTimeout: ReturnType<typeof setTimeout> | undefined;
    private readonly sessionsBackground = new SessionsBackground();

    constructor(params: AbstractTransportParams) {
        const { messages, logger, debugLink } = params;

        super({
            messages,
            api: new UdpApi({ logger, debugLink }),
            logger,
        });
    }

    public init() {
        return this.scheduleAction(async () => {
            // in udp there is no synchronization.
            this.sessionsClient.init({
                requestFn: args => this.sessionsBackground.handleMessage(args),
                registerBackgroundCallbacks: () => {},
            });

            this.sessionsBackground.on('descriptors', descriptors => {
                this.sessionsClient.emit('descriptors', descriptors);
            });

            const handshakeRes = await this.sessionsClient.handshake();
            this.stopped = !handshakeRes.success;

            return handshakeRes;
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
        this.sessionsBackground.dispose();

        return super.stop();
    }
}
