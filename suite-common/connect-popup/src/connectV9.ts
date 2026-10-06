import { type ConnectCallSource } from './connectPopupTypes';

/**
 * Whether the calling app uses `@trezor/connect` 9.x, according to the npm version in its
 * manifest.
 */
export const isConnectV9Source = (source: ConnectCallSource): boolean =>
    source.manifest.npmVersion?.startsWith('9.') === true;
