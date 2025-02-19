// Long.js needed to make protobuf encoding work with numbers over Number.MAX_SAFE_INTEGER
// Docs claim that it should be enough to only install this dependency and it will be required automatically
// see: https://github.com/protobufjs/protobuf.js/#compatibility
// But we found that it does not work in browser environment
// see: https://github.com/protobufjs/protobuf.js/issues/758
import Long from 'long';
import * as protobuf from 'protobufjs/light';

protobuf.util.Long = Long;
protobuf.configure();

export * from './decode';
export * from './encode';
export * as Messages from './messages';
export * from './types';
export { parseConfigure, createMessageFromName, createMessageFromType } from './utils';
export * as MessagesSchema from './messages-schema';
// It's problem to reexport enums when they are under MessagesSchema namespace, check packages/connect/src/types/device.ts
export { DeviceModelInternal } from './messages-schema';
