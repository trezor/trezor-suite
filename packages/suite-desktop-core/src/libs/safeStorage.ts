import { safeStorage } from 'electron';

import { DecryptionFailed, EncryptionUnavailable } from '@suite-common/platform-encryption';
import { isLinux } from '@trezor/env-utils';
import { err, ok } from '@trezor/type-utils';

export const isSafeStorageEncryptionAvailable = () => {
    if (!safeStorage.isEncryptionAvailable()) {
        return err(EncryptionUnavailable('SafeStorage encryption is not available'));
    }

    // NOTE: this method is NOT available on mac / windows, it is linux only
    if (!('getSelectedStorageBackend' in safeStorage)) {
        if (isLinux()) {
            return err(
                EncryptionUnavailable(
                    'SafeStorage#getSelectedStorageBackend is not available on Linux',
                ),
            );
        }

        return ok();
    }

    // This is probably covered by `isEncryptionAvailable()`, but just to be sure!
    // It is possible to allow `basic_text` by bad configuration
    if (safeStorage.getSelectedStorageBackend() === 'basic_text') {
        return err(EncryptionUnavailable('Storage Backend is "basic_text", not secure'));
    }

    return ok();
};

export const decryptFromSafeStorage = (value: string) => {
    const isEncryptionAvailableResult = isSafeStorageEncryptionAvailable();

    if (!isEncryptionAvailableResult.success) {
        return isEncryptionAvailableResult;
    }

    try {
        const buffer = Buffer.from(value, 'hex');
        const decryptedValue = safeStorage.decryptString(buffer);

        return ok(decryptedValue);
    } catch {
        return err(DecryptionFailed());
    }
};

export const encryptToSafeStorage = (value: string) => {
    const isEncryptionAvailableResult = isSafeStorageEncryptionAvailable();

    if (!isEncryptionAvailableResult.success) {
        return isEncryptionAvailableResult;
    }

    const encryptedValue = safeStorage.encryptString(value).toString('hex');

    return ok(encryptedValue);
};
