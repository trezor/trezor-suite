import { AbstractTransportParams } from './abstract';

import { UdpApi } from '../api/udp';
import { AbstractApiTransport } from './abstractApi';

export class UdpTransport extends AbstractApiTransport {
    public name = 'UdpTransport' as const;
    private enumerateTimeout: ReturnType<typeof setTimeout> | undefined;

    constructor(params: AbstractTransportParams) {
        const { logger, debugLink, ...rest } = params;

        super({
            api: new UdpApi({ logger, debugLink }),
            logger,
            ...rest,
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
