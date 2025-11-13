export * as TRANSPORT_ERROR from './errors';

export type { Descriptor, Session, MessageResponse, ApiType } from './types';
export { TREZOR_USB_DESCRIPTORS, TRANSPORT } from './constants';

export { AbstractTransport as Transport, isTransportInstance } from './transports/abstract';
export { UnifiedTransport } from './transports/unified';
export { UsbApi } from './api/usb';
export { UdpApi } from './api/udp';
export { WebSocketProxyApi } from './api/ws-proxy';

// messages are exported but there is no real need to use them elsewhere
// transports have reference to this already
export { Messages } from '@trezor/protobuf';

export { SessionsBackground } from './sessions/background';
export { SessionsClient } from './sessions/client';
