import { WebUSB } from '@trezor/react-native-usb';
import { AbstractApiTransport, Transport as AbstractTransport, UsbApi } from '@trezor/transport';

export class NativeUsbTransport extends AbstractApiTransport {
    public name = 'NativeUsbTransport' as const;
    public apiType = 'usb' as const;

    constructor(params: ConstructorParameters<typeof AbstractTransport>[0]) {
        const { logger, ...rest } = params;

        super({
            api: new UsbApi({
                usbInterface: new WebUSB(),
                logger:
                    process.env.EXPO_PUBLIC_IS_NATIVE_USB_LOGGER_ENABLED === 'true'
                        ? console
                        : logger,
            }),
            logger,
            ...rest,
        });
    }
}
