/**
 * Change transports for communication with devices
 */

import type { ConnectSettings } from '@trezor/connect-common/src/types';

export type SetTransports = Pick<ConnectSettings, 'transports'>;

export declare function setTransports(params: SetTransports): void;
