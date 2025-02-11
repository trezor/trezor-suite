import { AbstractApiTransport, Transport as AbstractTransport } from '@trezor/transport';

import { BluetoothApi } from './api/BluetoothApi';

export class NativeBluetoothTransport extends AbstractApiTransport {
    public name = 'NativeBluetoothTransport' as any;
    public apiType = 'bluetooth' as const;

    constructor(params: ConstructorParameters<typeof AbstractTransport>[0]) {
        const { logger, ...rest } = params;

        super({
            api: new BluetoothApi({
                logger,
            }),
            ...rest,
        });
    }
}
