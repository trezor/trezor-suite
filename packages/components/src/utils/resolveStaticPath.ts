// todo: this should be shared with resolveStaticPath in suite-common/suite-utils/src/resolveStaticPath
// the problem is that @trezor scoped package must not import from @suite-common scoped package
// followup: create SuiteImage, SuiteDeviceAnimation component wrapper that will use resolveStaticPath util and pass it to Image component
// https://github.com/trezor/trezor-suite/issues/8433
export const resolveStaticPath = (
    path: string,
    pathPrefix: string | undefined = process.env.ASSET_PREFIX,
) => `${pathPrefix || ''}/static/${path.replace(/^\/+/, '')}`;
