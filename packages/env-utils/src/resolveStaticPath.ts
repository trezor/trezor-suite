/*
 Most apps use empty string as ASSET_PREFIX, which means loading assets from root of location.origin
 e.g. https://suite.trezor.io/web/settings will load /static/images/logo.svg from https://suite.trezor.io/static/images/logo.svg
 However on desktop, the app runs from file, for example AppImage: file:///tmp/.mount_TrezorAvGo8g/resources/app.asar/build
 There is no location.origin, so using /path would incorrectly resolve as file:///path
 On Desktop, we therefore need to use relative paths, e.g. ./static/images/logo.svg
 Note that `process` may not be defined (e.g. in storybook), so accessing it without checking would crash.
*/
const getEnvAssetPrefix = () =>
    typeof process !== 'undefined' ? process.env?.ASSET_PREFIX : undefined;
const getDefaultPrefix = () => getEnvAssetPrefix() ?? '';

export const resolveStaticPath = (
    path: string,
    pathPrefix: string | undefined = getDefaultPrefix(),
) => `${pathPrefix}/static/${path.replace(/^\/+/, '')}`;

export const resolveConnectPath = (
    path: string,
    pathPrefix: string | undefined = getDefaultPrefix(),
) => `${pathPrefix}/${path.replace(/^\/+/, '')}`;
