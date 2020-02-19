import { AppState } from '@suite-types';

export const isWebUSB = (transport?: AppState['suite']['transport']) =>
    !!(transport && transport.type && transport.type === 'WebUsbPlugin');
