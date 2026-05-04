export * as TRANSPORT_ERROR from './errors';

export * from './types';
export type {
    UsbDeviceLike,
    UsbInTransferResultLike,
    UsbOutTransferResultLike,
    UsbInterfaceApi,
    UsbInterfaceLike,
    UsbConfigurationLike,
    UsbConnectionEventLike,
} from './types/usbInterface';
export {
    TREZOR_USB_DESCRIPTORS,
    TRANSPORT,
    DEVICE_TYPE,
    ACTION_TIMEOUT,
    CONFIGURATION_ID,
    DEBUGLINK_ENDPOINT_ID,
    DEBUGLINK_INTERFACE_ID,
    ENDPOINT_ID,
    INTERFACE_ID,
    T1_HID_PRODUCT,
    T1_HID_VENDOR,
    WEBUSB_BOOTLOADER_PRODUCT,
} from './constants';

export {
    AbstractTransport,
    AbstractTransport as Transport,
    isTransportInstance,
} from './transports/abstract';
export type {
    AbstractTransportParams,
    AbstractTransportMethodParams,
    AcquireInput,
    ReleaseInput,
    TransportDeviceEvent,
} from './transports/abstract';
export { AbstractApiTransport } from './transports/abstractApi';
export { AbstractApi } from './api/abstract';
export type {
    AbstractApiAwaitedResult,
    AbstractApiConstructorParams,
    OpenDeviceChannel,
} from './api/abstract';
export { UsbApi } from './api/usb';

export { SessionsBackground } from './sessions/background';
export { SessionsClient } from './sessions/client';
export type { SessionsBackgroundInterface } from './sessions/types';
