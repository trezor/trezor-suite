import TrezorConnect, { DEVICE, DEVICE_EVENT } from '@trezor/connect';

// Exercise the published .d.ts at the consumer level, two ways the runtime smoke
// cannot:
//   1. Parameters<> on the default export's methods proves the API surface is
//      importable and shaped the way a third-party consumer expects.
//   2. The named DEVICE / DEVICE_EVENT imports prove @trezor/connect actually
//      re-exports the members it pulls from @trezor/connect-core. Those flow
//      through `export * from '@trezor/connect-core/lib/exports'` in connect's
//      shipped .d.ts; if that cross-package specifier is unresolvable under the
//      consumer's NodeNext moduleResolution (e.g. the producer shipping it
//      extensionless), the whole star-export silently contributes zero names and
//      these imports fail with TS2614 — exactly the regression that shipped in
//      10.0.0-beta.3. Neither the runtime smoke (the default import resolves fine
//      at runtime) nor `attw --profile esm-only` (which validates the package's
//      own entry point, not the deep cross-package re-export chain) detects this
//      class, so it must be asserted here. skipLibCheck:true (like real
//      consumers) still surfaces it: that flag suppresses type-checking inside
//      dependency .d.ts files, not export-binding resolution in this consumer.
type ChangeLanguageParams = Parameters<typeof TrezorConnect.changeLanguage>[0];
type FirmwareUpdateParams = Parameters<typeof TrezorConnect.firmwareUpdate>[0];
type EthereumSignTypedDataParams = Parameters<typeof TrezorConnect.ethereumSignTypedData>[0];
type CardanoSignTransactionParams = Parameters<typeof TrezorConnect.cardanoSignTransaction>[0];

const _connect: typeof TrezorConnect = TrezorConnect;
const _device: typeof DEVICE = DEVICE;
const _deviceEvent: typeof DEVICE_EVENT = DEVICE_EVENT;

export type {
    CardanoSignTransactionParams,
    ChangeLanguageParams,
    EthereumSignTypedDataParams,
    FirmwareUpdateParams,
};
export { _connect, _device, _deviceEvent };
