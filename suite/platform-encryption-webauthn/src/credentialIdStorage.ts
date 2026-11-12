const CREDENTIAL_ID_STORAGE_KEY = 'trezor-suite-webauthn-credential-id';

export type StorageCredentialIdStorageDeps = {
    storage: Pick<Storage, 'getItem' | 'setItem'>;
};

/** @serviceContract */
export type WebauthnCredentialIdStorage = {
    getCredentialId: () => string | null;
    setCredentialId: (credentialIdHex: string) => void;
};

export const createStorageCredentialIdStorage = (
    deps: StorageCredentialIdStorageDeps,
): WebauthnCredentialIdStorage => ({
    getCredentialId: () => deps.storage.getItem(CREDENTIAL_ID_STORAGE_KEY),
    setCredentialId: credentialIdHex =>
        deps.storage.setItem(CREDENTIAL_ID_STORAGE_KEY, credentialIdHex),
});
