import type { TrezorConnectPrivilegedAPI } from '@trezor/connect-common';

export * from '@trezor/connect-common';

/**
 * Connect API exposed by the browser entry, including its browser-only WebUSB device picker.
 *
 * Use this type instead of importing the browser implementation directly. The WebUSB action should
 * eventually move behind an environment abstraction or dependency injection rather than becoming
 * part of the shared Connect API.
 */
export type TrezorConnectWithBrowserAPI = TrezorConnectPrivilegedAPI & {
    requestWebUSBDevice: () => Promise<void>;
};

// note: only @trezor/connect re-exports protobuf runtime
export { MessagesSchema as PROTO } from '@trezor/protobuf';
// note: backwards compatibility with suite. I don't think we need to export this publicaly
export { TRANSPORT } from '@trezor/transport-common';

// Do NOT add any code exports here. Only TrezorConnect and types shall be exported from
// `@trezor/connect` package.
