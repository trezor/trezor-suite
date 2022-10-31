import { PartialDevice } from './types';

export const getDeviceModel = (device?: PartialDevice) => device?.features?.model || '';
