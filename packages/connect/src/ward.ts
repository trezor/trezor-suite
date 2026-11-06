// Kept in a separate entry point so browser bundles never load a native addon.
export { RustWardRelay } from '@trezor/connect-core/src/api/wardMethods/rustWardRelay';
export type {
    RustWardAdapter,
    RustWardRelayOptions,
} from '@trezor/connect-core/src/api/wardMethods/rustWardRelay';
