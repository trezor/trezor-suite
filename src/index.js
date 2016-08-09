/* @flow */

import {patch} from './protobuf/monkey_patch';
patch();

export {LowlevelTransport} from './lowlevel-transport';
export type {AcquireInput, TrezorDeviceInfoWithSession} from './transport';

