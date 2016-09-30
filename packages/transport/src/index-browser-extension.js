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

export default {
  bridge: BridgeTransport,
  parallel: ParallelTransport,
  fallback: FallbackTransport,
  chromeUdp: ChromeUdpPlugin,
  chromeHid: ChromeHidPlugin,
  lowlevel: LowlevelTransport,
};
