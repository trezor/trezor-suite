import { type Identity, MnemonicIdentity } from '@arkade-os/sdk';

import { type SuiteSyncOwnerSecretHex } from '@suite-common/suite-sync-storage';

import { deriveArkMnemonicFromSuiteSyncSecret } from './arkMnemonic';

export type CreateFakeArkSignerParams = {
    trezorSecret: SuiteSyncOwnerSecretHex;
    isMainnet?: boolean;
};

// The signer factory is intentionally async-shaped even though the SDK
// MnemonicIdentity factory is synchronous today. Future Trezor-backed
// signing flows will need device communication here, so the Promise
// envelope keeps the interface stable across implementations.
export type CreateFakeArkSigner = (params: CreateFakeArkSignerParams) => Promise<Identity>;

export type CreateFakeArkSignerDep = {
    createFakeArkSigner: CreateFakeArkSigner;
};

// This derives the Ark mnemonic from the Suite Sync owner secret and returns
// an SDK MnemonicIdentity. It is the point where SuiteSync key material
// becomes Ark wallet keys, so it stays inside the signer package.
export const createFakeArkSigner: CreateFakeArkSigner = ({ trezorSecret, isMainnet = false }) => {
    const arkMnemonic = deriveArkMnemonicFromSuiteSyncSecret(trezorSecret);

    if (!arkMnemonic.success) {
        return Promise.reject(new Error(arkMnemonic.error.type));
    }

    return Promise.resolve(MnemonicIdentity.fromMnemonic(arkMnemonic.payload, { isMainnet }));
};
