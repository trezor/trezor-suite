// ThpCreateNewSession replacement
// either passphrase or on_device needs to be present
export type ThpCreateNewSession = { derive_cardano?: boolean } & (
    | { passphrase: string; on_device?: undefined }
    | { passphrase?: undefined; on_device: boolean }
);
