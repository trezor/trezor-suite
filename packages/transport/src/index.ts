import BridgeTransportV2 from './bridge/v2';
import LowlevelTransportWithSharedConnections from './lowlevel/withSharedConnections';
import FallbackTransport from './fallback';
import WebUsbPlugin from './lowlevel/webusb';

// Long.js needed to make protobuf encoding work with numbers over Number.MAX_SAFE_INTEGER
// Docs claim that it should be enough to only install this dependency and it will be required automatically
// see: https://github.com/protobufjs/protobuf.js/#compatibility
// But we found that it does not work in browser environment
// see: https://github.com/protobufjs/protobuf.js/issues/758
import * as protobuf from 'protobufjs/light';
import * as Long from 'long';

protobuf.util.Long = Long;
protobuf.configure();

export type {
    Transport,
    AcquireInput,
    TrezorDeviceInfoWithSession,
    MessageFromTrezor,
} from './types';

export { Messages } from './types';

export default {
    BridgeV2: BridgeTransportV2,
    Fallback: FallbackTransport,
    Lowlevel: LowlevelTransportWithSharedConnections,
    WebUsb: WebUsbPlugin,
};
