/*
 Most apps use empty string as ASSET_PREFIX, which means loading assets from root of location.origin
 e.g. https://suite.trezor.io/web/settings will load /static/images/logo.svg from https://suite.trezor.io/static/images/logo.svg
 On Desktop, ASSET_PREFIX is `.`, so the paths are relative, e.g. ./static/images/logo.svg
 The main process serves the app's `build` directory as the root of suite://app, where the page is suite://app/index.html,
 so a relative path names the same file as an absolute one; being relative keeps it independent of where the page is served.
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
