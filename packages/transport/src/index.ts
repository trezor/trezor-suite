export * as TRANSPORT_ERROR from './errors';

export type { Descriptor, Session } from './types';
export { TREZOR_USB_DESCRIPTORS, TRANSPORT } from './constants';

export { AbstractTransport as Transport, isTransportInstance } from './transports/abstract';
export { AbstractApiTransport } from './transports/abstractApi';
export { UsbApi } from './api/usb';

// messages are exported but there is no real need to use them elsewhere
// transports have reference to this already
export { Messages } from '@trezor/protobuf';

// browser + node
export { BridgeTransport } from './transports/bridge';

// browser (chrome-like) only
export { WebUsbTransport } from './transports/webusb';

// node only
export { NodeUsbTransport } from './transports/nodeusb';
export { SessionsBackground } from './sessions/background';
export { SessionsClient } from './sessions/client';

export { UdpTransport } from './transports/udp';
