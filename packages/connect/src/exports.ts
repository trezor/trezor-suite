export * from '@trezor/connect-common';

// note: only @trezor/connect re-exports protobuf runtime
export { Messages as PROTO } from '@trezor/protobuf';
// note: backwards compatibility with suite. I don't think we need to export this publicaly
export { TRANSPORT } from '@trezor/transport';

// Do NOT add any code exports here. Only TrezorConnect and types shall be exported from
// `@trezor/connect` package.
