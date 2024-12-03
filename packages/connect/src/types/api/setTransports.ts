/**
 * Change transports for communication with devices
 */

import type { ConnectSettings } from '../settings';

export type SetTransports = Pick<ConnectSettings, 'transports'>;

export declare function setTransports(params: SetTransports): void;
