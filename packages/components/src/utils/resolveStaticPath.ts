// This needs to be set as `.` so it loads from appDir of the Electron app.
// For example (in case of AppImage): `file:///tmp/.mount_TrezorAvGo8g/resources/app.asar/build`,
// where the requested asset (for example: `static/images/images/app-store-badge.svg`) is located.
const DEFAULT_ASSET_PREFIX = '.';

// todo: this should be shared with resolveStaticPath in suite-common/suite-utils/src/resolveStaticPath
// the problem is that @trezor scoped package must not import from @suite-common scoped package
// followup: create SuiteImage, SuiteDeviceAnimation component wrapper that will use resolveStaticPath util and pass it to Image component
// https://github.com/trezor/trezor-suite/issues/8433
export const resolveStaticPath = (
    path: string,
    pathPrefix: string | undefined = typeof process !== 'undefined'
        ? process.env.ASSET_PREFIX
        : DEFAULT_ASSET_PREFIX,
) => `${pathPrefix || DEFAULT_ASSET_PREFIX}/static/${path.replace(/^\/+/, '')}`;
