import { TimerId } from '@trezor/type-utils';

import { AbstractTransportParams } from './abstract';
import { UdpApi } from '../api/udp';
import { AbstractApiTransport } from './abstractApi';

export class UdpTransport extends AbstractApiTransport {
    public name = 'UdpTransport' as const;
    public apiType = 'udp' as const;
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
