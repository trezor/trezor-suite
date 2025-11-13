/**
 * Change API types for communication with devices
 */

import type { ConnectSettings } from '../settings';

export type SetTransports = Pick<ConnectSettings, 'apiTypes'>;

export declare function setTransports(params: SetTransports): void;
