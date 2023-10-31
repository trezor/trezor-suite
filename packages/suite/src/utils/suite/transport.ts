import { AppState } from 'src/types/suite';

export const isWebUsb = (transport?: AppState['suite']['transport']) =>
    !!(transport && transport.type && transport.type === 'WebBluetoothTransport');
