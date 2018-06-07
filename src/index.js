/* @flow */

// export is empty, you can import by "trezor-link/parallel", "trezor-link/lowlevel", "trezor-link/bridge"

export type {Transport, AcquireInput, TrezorDeviceInfoWithSession, MessageFromTrezor} from './transport';

import BridgeTransportV1 from './bridge/v1';
import BridgeTransportV2 from './bridge/v2';
import LowlevelTransportWithSharedConnections from './lowlevel/withSharedConnections';
import ExtensionTransport from './extension';
import ParallelTransport from './parallel';
import FallbackTransport from './fallback';
import WebUsbPlugin from './lowlevel/webusb';

import 'whatwg-fetch';

if (typeof window === `undefined`) {
  // eslint-disable-next-line quotes
  const fetch = require('node-fetch');
  BridgeTransportV1.setFetch(fetch, true);
  BridgeTransportV2.setFetch(fetch, true);
} else {
  BridgeTransportV1.setFetch(fetch, false);
  BridgeTransportV2.setFetch(fetch, false);
}

export default {
  BridgeV1: BridgeTransportV1,
  BridgeV2: BridgeTransportV2,
  Extension: ExtensionTransport,
  Parallel: ParallelTransport,
  Fallback: FallbackTransport,
  Lowlevel: LowlevelTransportWithSharedConnections,
  WebUsb: WebUsbPlugin,
};
