export { decodeMessage } from './decode';
export { encodeMessage } from './encode';
export * as Messages from './messages';
export * from './types';
export { parseConfigure } from './utils';
export * as MessagesSchema from './messages-schema';
// It's problem to reexport enums when they are under MessagesSchema namespace, check packages/connect/src/types/device.ts
export { DeviceModelInternal } from './messages-schema';
