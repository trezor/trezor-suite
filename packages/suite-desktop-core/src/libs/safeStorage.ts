import { safeStorage } from 'electron';

import { DecryptionFailed, EncryptionUnavailable } from '@suite-common/platform-encryption';
import { isLinux } from '@trezor/env-utils';
import { err, ok } from '@trezor/type-utils';

const SAFE_STORAGE_ENCRYPTED_PREFIX = 'safeStorage:encrypted:';
const SAFE_STORAGE_PLAINTEXT_PREFIX = 'safeStorage:plaintext:';

type OnDidChangeCallback<T> = (newValue?: T, oldValue?: T) => void;
type SafeStoragePrimitiveValue = boolean | string;
type StoredSafeStoragePrimitiveValue<T extends SafeStoragePrimitiveValue> =
    T | SafeStorageEncryptedValue | SafeStoragePlaintextValue;

const asSafeStorageEncryptedValue = (value: string) => value as SafeStorageEncryptedValue;

const asSafeStoragePlaintextValue = (value: string) => value as SafeStoragePlaintextValue;

const isSafeStorageEncryptedValue = (value: unknown): value is SafeStorageEncryptedValue =>
    typeof value === 'string' && value.startsWith(SAFE_STORAGE_ENCRYPTED_PREFIX);

const isSafeStoragePlaintextValue = (value: unknown): value is SafeStoragePlaintextValue =>
    typeof value === 'string' && value.startsWith(SAFE_STORAGE_PLAINTEXT_PREFIX);

const serializePrimitiveValue = (value: SafeStoragePrimitiveValue) =>
    typeof value === 'boolean' ? String(value) : value;

const deserializePrimitiveValue = <T extends SafeStoragePrimitiveValue>({
    decryptedValue,
    defaultValue,
}: {
    decryptedValue: string;
    defaultValue: T | undefined;
}): T | undefined => {
    if (typeof defaultValue === 'boolean') {
        if (decryptedValue === 'true') {
            return true as T;
        }

        if (decryptedValue === 'false') {
            return false as T;
        }

        return defaultValue;
    }

    return decryptedValue as T;
};

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

export const decryptStoredPrimitiveValue = <T extends SafeStoragePrimitiveValue>({
    rawValue,
    defaultValue,
}: {
    rawValue: StoredSafeStoragePrimitiveValue<T> | undefined;
    defaultValue: T | undefined;
}): T | undefined => {
    if (typeof rawValue === 'undefined') {
        return undefined;
    }

    if (typeof rawValue === 'boolean') {
        return rawValue as T;
    }

    if (isSafeStoragePlaintextValue(rawValue)) {
        return rawValue.slice(SAFE_STORAGE_PLAINTEXT_PREFIX.length) as T;
    }

    if (!isSafeStorageEncryptedValue(rawValue)) {
        return rawValue as T;
    }

    const decryptResult = decryptFromSafeStorage(
        rawValue.slice(SAFE_STORAGE_ENCRYPTED_PREFIX.length),
    );

    if (!decryptResult.success) {
        return defaultValue;
    }

    return deserializePrimitiveValue({
        decryptedValue: decryptResult.payload,
        defaultValue,
    });
};

export const encryptStoredPrimitiveValue = <T extends SafeStoragePrimitiveValue>(
    value: T | undefined,
) => {
    if (typeof value === 'undefined') {
        return undefined;
    }

    const encryptResult = encryptToSafeStorage(serializePrimitiveValue(value));

    if (!encryptResult.success) {
        if (typeof value === 'boolean') {
            return value;
        }

        return asSafeStoragePlaintextValue(`${SAFE_STORAGE_PLAINTEXT_PREFIX}${value}`);
    }

    return asSafeStorageEncryptedValue(`${SAFE_STORAGE_ENCRYPTED_PREFIX}${encryptResult.payload}`);
};

export const wrapOnDidChangeWithDecryptedValues =
    <StoredValue, DecryptedValue>({
        decryptValue,
        callback,
    }: {
        decryptValue: (value: StoredValue | undefined) => DecryptedValue | undefined;
        callback: OnDidChangeCallback<DecryptedValue>;
    }) =>
    (newValue?: StoredValue, oldValue?: StoredValue) => {
        callback(decryptValue(newValue), decryptValue(oldValue));
    };
