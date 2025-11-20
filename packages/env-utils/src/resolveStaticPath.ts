const isWeb = () => process.env.SUITE_TYPE === 'web'; // duplicated with envUtils.ts to prevent importing it in mobile

// This needs to be set as `.` so it loads from appDir of the Electron app.
// For example (in case of AppImage): `file:///tmp/.mount_TrezorAvGo8g/resources/app.asar/build`,
// where the requested asset (for example: `static/images/images/app-store-badge.svg`) is located.
const getDefaultAssetPrefix = () => (isWeb() ? '' : '.');

export const resolveStaticPath = (
    path: string,
    pathPrefix: string | undefined = process.env.ASSET_PREFIX,
) => `${pathPrefix || getDefaultAssetPrefix()}/static/${path.replace(/^\/+/, '')}`;

export const resolveConnectPath = (
    path: string,
    pathPrefix: string | undefined = process.env.ASSET_PREFIX,
) => `${pathPrefix || getDefaultAssetPrefix()}/${path.replace(/^\/+/, '')}`;
