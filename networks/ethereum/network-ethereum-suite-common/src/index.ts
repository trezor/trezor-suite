// The network module is exposed on the `/network-module` subpath instead of here. It reaches the
// ENS resolver, and through it `@trezor/connect` and viem, which every consumer of this barrel
// would have to bundle — connect-explorer's Next build fails outright on the Cardano wasm that
// comes with connect's coin APIs.

// These exports are temporary migration aids. Once network modularization is complete,
// wrapped-native token configuration shall remain private to the Ethereum network module.
export {
    getWrappedNativeAddress,
    getWrappedNativeSymbol,
    getWrappedNativeToken,
    isWrappedNativeToken,
} from './wrappedNativeToken';
