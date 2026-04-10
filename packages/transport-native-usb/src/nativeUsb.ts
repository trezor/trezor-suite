import { WebUSB } from '@trezor/react-native-usb';
import { UsbApi } from '@trezor/transport/src/api/usb';
import { type AbstractTransport } from '@trezor/transport/src/transports/abstract';
import { AbstractApiTransport } from '@trezor/transport/src/transports/abstractApi';

export class NativeUsbTransport extends AbstractApiTransport {
    public name = 'NativeUsbTransport' as const;

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

        // Let the native Kotlin code handle the chunking.
        // It significantly improves the performance of writes during FW update.
        this.api.nativeWriteChunking = true;
    }
}
