import { WebUSB } from '@trezor/react-native-usb';
import { Transport as AbstractTransport, AbstractApiTransport, UsbApi } from '@trezor/transport';

export class NativeUsbTransport extends AbstractApiTransport {
    public name = 'NativeUsbTransport' as const;
    public apiType = 'usb' as const;

    constructor(params: ConstructorParameters<typeof AbstractTransport>[0]) {
        const { logger, ...rest } = params;

        super({
            api: new UsbApi({
                usbInterface: new WebUSB(),
                logger,
            }),
            ...rest,
        });
    }

    public listen() {
        this.api.listen();

        return super.listen();
    }
}
