/**
 * Initializes TrezorConnect.
 * `manifest` is required
 */

import type { ConnectSettingsPublic, Manifest } from '../settings';

export declare function init(
    settings: { manifest: Manifest } & Partial<ConnectSettingsPublic>,
): Promise<void>;
