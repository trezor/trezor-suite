import { Transport as AbstractTransport, AbstractApiTransport } from '@trezor/transport';

import { BleApi } from './api/bleApi';

export class NativeTransportBLE extends AbstractApiTransport {
    public name = 'NativeTransportBLE' as any;

    constructor(params?: ConstructorParameters<typeof AbstractTransport>[0]) {
        const { messages, logger } = params || {};

        super({
            messages,
            api: new BleApi({
                logger,
            }),
            logger,
        });
    }
}
