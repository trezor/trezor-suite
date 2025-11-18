import { isWeb } from '@trezor/env-utils';
// This needs to be set as `.` so it loads from appDir of the Electron app.
// For example (in case of AppImage): `file:///tmp/.mount_TrezorAvGo8g/resources/app.asar/build`,
// where the requested asset (for example: `static/images/images/app-store-badge.svg`) is located.

const DEFAULT_ASSET_PREFIX = isWeb() ? '' : '.';

export const resolveStaticPath = (
    path: string,
    pathPrefix: string | undefined = process.env.ASSET_PREFIX,
) => `${pathPrefix || DEFAULT_ASSET_PREFIX}/static/${path.replace(/^\/+/, '')}`;

export const resolveConnectPath = (
    path: string,
    pathPrefix: string | undefined = process.env.ASSET_PREFIX,
) => `${pathPrefix || DEFAULT_ASSET_PREFIX}/${path.replace(/^\/+/, '')}`;
