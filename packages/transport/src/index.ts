export * as TRANSPORT_ERROR from './errors';

export type { Descriptor, Session, MessageResponse } from './types';
export { TREZOR_USB_DESCRIPTORS, TRANSPORT } from './constants';

export { AbstractTransport as Transport, isTransportInstance } from './transports/abstract';
export { AbstractApiTransport } from './transports/abstractApi';

// Concrete transports moved to environment-specific subpaths so node consumers
// no longer pull browser USB types (and vice versa) through this barrel:
//   - @trezor/transport/bridge — BridgeTransport, createBridgeTransports
//   - @trezor/transport/web    — WebUsbTransport, UsbApi
//   - @trezor/transport/node   — NodeUsbTransport, UdpTransport, UsbApi,
//                                SessionsBackground, SessionsClient
