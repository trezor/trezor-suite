import { Transport as AbstractTransport, AbstractApiTransport } from '@trezor/transport';

import { BleApi } from './api/bleApi';

export class NativeTransportBLE extends AbstractApiTransport {
    public name = 'NativeTransportBLE' as any;
    public apiType = 'bluetooth' as const;

    constructor(params?: ConstructorParameters<typeof AbstractTransport>[0]) {
        const { logger } = params || {};

        super({
            id: 'native-ble',
            api: new BleApi({
                logger,
            }),
            ...params,
        });
    }
}
