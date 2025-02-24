// Long.js needed to make protobuf encoding work with numbers over Number.MAX_SAFE_INTEGER
// Docs claim that it should be enough to only install this dependency and it will be required automatically
// see: https://github.com/protobufjs/protobuf.js/#compatibility
// But we found that it does not work in browser environment
// see: https://github.com/protobufjs/protobuf.js/issues/758
import Long from 'long';
import * as protobuf from 'protobufjs/light';

import { decodeMessage as decode } from './decode';
import { encodeMessage as encode } from './encode';
import { parseConfigure as parse } from './utils';

export const { parseConfigure, decodeMessage, encodeMessage } = (() => {
    protobuf.util.Long = Long;
    protobuf.configure();

    return { parseConfigure: parse, decodeMessage: decode, encodeMessage: encode };
})();

export * from './types';
export * as Messages from './messages';
export * as MessagesSchema from './messages-schema';

// It's problem to reexport enums when they are under MessagesSchema namespace, check packages/connect/src/types/device.ts
export { DeviceModelInternal } from './messages-schema';
