/* @flow */

// export is empty, you can import by "trezor-link/parallel", "trezor-link/lowlevel", "trezor-link/bridge"

export type {Transport, AcquireInput, TrezorDeviceInfoWithSession, MessageFromTrezor} from './transport';
export type {LowlevelTransportPlugin} from './lowlevel/plugin';

import BridgeTransport from './bridge';
import LowlevelTransport from './lowlevel';
import ParallelTransport from './parallel';
import FallbackTransport from './fallback';
import ChromeUdpPlugin from './lowlevel/chrome-udp';
import ChromeHidPlugin from './lowlevel/chrome-hid';

BridgeTransport.setFetch(fetch);

export default {
  Bridge: BridgeTransport,
  Parallel: ParallelTransport,
  Fallback: FallbackTransport,
  ChromeUdp: ChromeUdpPlugin,
  ChromeHid: ChromeHidPlugin,
  Lowlevel: LowlevelTransport,
};
