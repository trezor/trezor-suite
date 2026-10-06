/**
 * Message channel identifiers used in the handshake between `@trezor/connect-webextension` and Suite Web.
 * Both sides are released independently (npm package vs. deployed app), so these values are a public
 * protocol: changing them breaks already released webextensions or the deployed Suite Web.
 */
export const WEBEXTENSION_SUITE_WEB_CHANNEL = {
    webextension: '@trezor/connect-webextension-externally-connectable',
    suiteWeb: '@trezor/suite-web',
} as const;
