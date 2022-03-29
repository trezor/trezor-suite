/**
 * Initializes TrezorConnect.
 * `manifest` is required
 */

import type { ConnectSettings, Manifest } from '../settings';

export declare function init(
    settings: { manifest: Manifest } & Partial<ConnectSettings>,
): Promise<void>;
