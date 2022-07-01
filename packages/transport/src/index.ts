// Long.js needed to make protobuf encoding work with numbers over Number.MAX_SAFE_INTEGER
// Docs claim that it should be enough to only install this dependency and it will be required automatically
// see: https://github.com/protobufjs/protobuf.js/#compatibility
// But we found that it does not work in browser environment
// see: https://github.com/protobufjs/protobuf.js/issues/758
import * as protobuf from 'protobufjs/light';
import * as Long from 'long';

protobuf.util.Long = Long;
protobuf.configure();

export type { AcquireInput, TrezorDeviceInfoWithSession, MessageFromTrezor } from './types';
export type { Transport } from './transports/abstract';

export { Messages } from './types';

export { BridgeTransport } from './transports/bridge';
export { WebUsbTransport } from './transports/webusb';
export { NodeUsbTransport } from './transports/nodeusb';

export { getAvailableTransport } from './utils/getAvailableTransport';
