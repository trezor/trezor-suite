import BridgeTransportV2 from './bridge/v2';
import LowlevelTransportWithSharedConnections from './lowlevel/withSharedConnections';
import FallbackTransport from './fallback';
import WebUsbPlugin from './lowlevel/webusb';

export type {
    Transport,
    AcquireInput,
    TrezorDeviceInfoWithSession,
    MessageFromTrezor,
} from './types';

export default {
    BridgeV2: BridgeTransportV2,
    Fallback: FallbackTransport,
    Lowlevel: LowlevelTransportWithSharedConnections,
    WebUsb: WebUsbPlugin,
};
