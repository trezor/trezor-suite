import TrezorConnect from '@trezor/connect';

// Exercise the published .d.ts at the consumer level: resolving these
// Parameters<> types proves the packed types are importable and shaped the
// way a third-party consumer expects — a regression the runtime smoke below
// cannot detect. The fixture tsconfig sets skipLibCheck:true (like real
// consumers), so this does NOT catch a producer shipping an unresolvable
// inline `import("@trezor/*/lib/...")` subpath; that class of regression is
// guarded by the `attw` "Check exports" step in the workflow, not here.
type ChangeLanguageParams = Parameters<typeof TrezorConnect.changeLanguage>[0];
type FirmwareUpdateParams = Parameters<typeof TrezorConnect.firmwareUpdate>[0];
type EthereumSignTypedDataParams = Parameters<typeof TrezorConnect.ethereumSignTypedData>[0];
type CardanoSignTransactionParams = Parameters<typeof TrezorConnect.cardanoSignTransaction>[0];

const _connect: typeof TrezorConnect = TrezorConnect;

export type {
    CardanoSignTransactionParams,
    ChangeLanguageParams,
    EthereumSignTypedDataParams,
    FirmwareUpdateParams,
};
export { _connect };
