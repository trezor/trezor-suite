import { WebUSB } from '@trezor/react-native-usb';
import { UnifiedTransport, UsbApi } from '@trezor/transport';
import { UnifiedTransportParams } from '@trezor/transport/src/transports/unified';

export class NativeUsbTransport extends UnifiedTransport {
    // Note: name is 'UnifiedTransport' from parent class

    constructor(params: Omit<UnifiedTransportParams, 'apis'>) {
        const { logger, ...rest } = params;

        super({
            apis: [
                new UsbApi({
                    usbInterface: new WebUSB(),
                    logger:
                        process.env.EXPO_PUBLIC_IS_NATIVE_USB_LOGGER_ENABLED === 'true'
                            ? console
                            : logger,
                    debugLink: false,
                }),
            ],
            logger,
            ...rest,
        });
    }
}
