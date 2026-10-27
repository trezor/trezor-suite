// The connect distribution packages, the roots of the connect publish closure.
// These four are released by `deploy-npm-connect` (a hardcoded matrix), not by
// `deploy-npm-connect-dependencies`, which releases the rest of the closure.
export const CONNECT_PUBLISH_ROOTS: ReadonlyArray<string> = [
    '@trezor/connect',
    '@trezor/connect-web',
    '@trezor/connect-mobile',
    '@trezor/connect-webextension',
];
