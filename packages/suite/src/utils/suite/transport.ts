import { AppState } from '@suite-types';

type Transport = NonNullable<AppState['suite']['transport']>;

export const isWebUSB = (transport?: Transport) =>
    !!(transport && transport.type && transport.type === 'WebUsbPlugin');
