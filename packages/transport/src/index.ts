// Long.js needed to make protobuf encoding work with numbers over Number.MAX_SAFE_INTEGER
// Docs claim that it should be enough to only install this dependency and it will be required automatically
// see: https://github.com/protobufjs/protobuf.js/#compatibility
// But we found that it does not work in browser environment
// see: https://github.com/protobufjs/protobuf.js/issues/758
import * as protobuf from 'protobufjs/light';
import Long from 'long';

export * as TRANSPORT_ERROR from './errors';

protobuf.util.Long = Long;
protobuf.configure();

export type { MessageFromTrezor, Descriptor } from './types';
export { TREZOR_USB_DESCRIPTORS, TRANSPORT } from './constants';

export { AbstractTransport as Transport } from './transports/abstract';

// messages are exported but there is no real need to use them elsewhere
// transports have reference to this already
export * as Messages from './types/messages';

// browser + node
export { BridgeTransport } from './transports/bridge';

// browser (chrome-like) only
export { WebUsbTransport } from './transports/webusb';

export { SessionsBackground } from './sessions/background';
export { SessionsClient } from './sessions/client';
