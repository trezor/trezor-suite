export * as TRANSPORT_ERROR from './errors';

export type { Descriptor, Session, MessageResponse } from './types';
export { TREZOR_USB_DESCRIPTORS, TRANSPORT } from './constants';

export { AbstractTransport as Transport, isTransportInstance } from './transports/abstract';
export { AbstractApiTransport } from './transports/abstractApi';

// browser + node
export { BridgeTransport } from './transports/bridge';

// browser (chrome-like) only
export { WebUsbTransport } from './transports/webusb';

// node only
export { NodeUsbTransport } from './transports/nodeusb';
export { SessionsBackground } from './sessions/background';
export { SessionsClient } from './sessions/client';

export { UdpTransport } from './transports/udp';
