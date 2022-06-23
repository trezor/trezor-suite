import { AppState } from '@suite-types';

export const isWebUSB = (transport?: AppState['suite']['transport']) =>
    // TODO(karliatto): probably change name `WebUsbPlugin` to `WebUsbTransport`.
    !!(transport && transport.type && transport.type === 'WebUsbPlugin');
