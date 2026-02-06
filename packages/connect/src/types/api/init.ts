/**
 * Initializes TrezorConnect.
 * `manifest` is required
 */

import type { ConnectSettingsPublic, Manifest } from '../settings';

// explicitly don't overlap types
export type InitFullSettings<ExtraSettingsType extends Record<string, any>> = {
    manifest: Manifest;
} & Partial<ConnectSettingsPublic> &
    ExtraSettingsType;

export type InitType<ExtraSettingsType extends Record<string, any>> = (
    settings: InitFullSettings<ExtraSettingsType>,
) => Promise<void>;

export declare function init<ExtraSettingsType extends Record<string, any>>(
    settings: InitFullSettings<ExtraSettingsType>,
): Promise<void>;
