import { AbstractApiTransport, type AbstractTransportParams } from '@trezor/transport-common';
import { type TimerId } from '@trezor/type-utils';

import { UdpApi, type UdpApiTargetOverride } from '../api/udp';

export interface UdpTransportParams extends AbstractTransportParams {
    target?: UdpApiTargetOverride;
}

export class UdpTransport extends AbstractApiTransport {
    public name = 'UdpTransport' as const;
    private enumerateTimeout: TimerId | undefined;

    constructor(params: UdpTransportParams) {
        const { logger, debugLink, target, ...rest } = params;

        super({
            api: new UdpApi({ logger, debugLink, target }),
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
