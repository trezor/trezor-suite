// Message channels
export * from './messageChannel/abstract';
export * from './messageChannel/window-window';
export * from './messageChannel/serviceworker-window';
export * from './messageChannel/window-serviceworker';

export * from './events';
export * from './types';
export * from './factory';
export * from './constants';
export * from './impl/dynamic';
export {
    parseConnectSettings,
    parseManifest,
    parseVersion,
    corsValidator,
} from './data/connectSettings';
export * from './utils/debug';
export * from './utils/urlUtils';
export { getSerializedPath, getSlip44ByPath, validatePath } from './utils/pathUtils';
export { connectCallableMethods } from './callableMethods';

// THP key brand types — re-exported from @trezor/protocol for public reach. Kept
// type-only on purpose: a value re-export of the `asX()` helpers would pull the
// `@trezor/protocol` barrel (and its Node `crypto`-dependent THP handshake code)
// into browser bundles that import the connect-common barrel. Consumers that need
// to construct branded values import the `asX()` helpers from `@trezor/protocol`
// directly (a Node context).
export type {
    HostStaticKey,
    HostStaticKeyHex,
    HostStaticPublicKey,
    HostStaticPublicKeyHex,
    TrezorStaticPublicKey,
    ThpCredentialId,
} from '@trezor/protocol';
