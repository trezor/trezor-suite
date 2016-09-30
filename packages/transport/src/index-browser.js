/* @flow */

// export is empty, you can import by "trezor-link/parallel", "trezor-link/lowlevel", "trezor-link/bridge"

export type {Transport, AcquireInput, TrezorDeviceInfoWithSession, MessageFromTrezor} from './transport';
export type {LowlevelTransportPlugin} from './lowlevel/plugin';

import BridgeTransport from './bridge';
import ExtensionTransport from './extension';
import ParallelTransport from './parallel';
import FallbackTransport from './fallback';

export default {
  bridge: BridgeTransport,
  extension: ExtensionTransport,
  parallel: ParallelTransport,
  fallback: FallbackTransport,
};
