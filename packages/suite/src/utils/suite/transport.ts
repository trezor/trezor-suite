import { AppState } from '@suite-types';

export const isWebUsb = (transport?: AppState['suite']['transport']) =>
    !!(transport && transport.type && transport.type === 'WebUsbPlugin');
