/* @flow */

// export is empty, you can import by "trezor-link/parallel", "trezor-link/lowlevel", "trezor-link/bridge"

export type {Transport, AcquireInput, TrezorDeviceInfoWithSession, MessageFromTrezor} from './transport';
export type {LowlevelTransportPlugin} from './lowlevel/plugin';

import BridgeTransport from './bridge';
import LowlevelTransport from './lowlevel';
import ExtensionTransport from './extension';
import ParallelTransport from './parallel';
import FallbackTransport from './fallback';
import NodeHidPlugin from './lowlevel/node-hid';

// eslint-disable-next-line quotes
const fetch = require('node-fetch');

// Allow electron apps to use native browser fetch (works better)
if (typeof window === `undefined`) {
  BridgeTransport.setFetch(fetch);
}

export default {
  Bridge: BridgeTransport,
  Extension: ExtensionTransport,
  Parallel: ParallelTransport,
  Fallback: FallbackTransport,
  NodeHid: NodeHidPlugin,
  Lowlevel: LowlevelTransport,
};
