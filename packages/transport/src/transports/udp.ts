import { AbstractApiTransport, type AbstractTransportParams } from '@trezor/transport-abstract';
import { type TimerId } from '@trezor/type-utils';

import { UdpApi } from '../api/udp';

export class UdpTransport extends AbstractApiTransport {
    public name = 'UdpTransport' as const;
    private enumerateTimeout: TimerId | undefined;

    constructor(params: AbstractTransportParams) {
        const { logger, debugLink, ...rest } = params;

        super({
            api: new UdpApi({ logger, debugLink }),
            logger,
            ...rest,
        });
    }

    public stop() {
        if (this.enumerateTimeout) {
            clearTimeout(this.enumerateTimeout);
            this.enumerateTimeout = undefined;
        }

        return super.stop();
    }
}
