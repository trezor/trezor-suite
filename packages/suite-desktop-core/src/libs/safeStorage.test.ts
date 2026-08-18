import { DecryptionFailed, EncryptionUnavailable } from '@suite-common/platform-encryption';
import { err, ok } from '@trezor/type-utils';

const mockGetSelectedStorageBackend = jest.fn();
const mockSafeStorage: {
    isEncryptionAvailable: jest.Mock;
    getSelectedStorageBackend?: jest.Mock;
    encryptString: jest.Mock;
    decryptString: jest.Mock;
} = {
    isEncryptionAvailable: jest.fn(),
    getSelectedStorageBackend: mockGetSelectedStorageBackend,
    encryptString: jest.fn(),
    decryptString: jest.fn(),
};

const mockIsLinux = jest.fn();

jest.mock('electron', () => ({
    get safeStorage() {
        return mockSafeStorage;
    },
}));

jest.mock('@trezor/env-utils', () => ({
    isLinux: () => mockIsLinux(),
}));

import {
    decryptStoredPrimitiveValue,
    decryptFromSafeStorage,
    encryptStoredPrimitiveValue,
    encryptToSafeStorage,
    isSafeStorageEncryptionAvailable,
    wrapOnDidChangeWithDecryptedValues,
} from './safeStorage';

describe('safeStorage', () => {
    beforeEach(() => {
        mockSafeStorage.isEncryptionAvailable.mockReturnValue(true);
        mockSafeStorage.getSelectedStorageBackend = mockGetSelectedStorageBackend;
        mockGetSelectedStorageBackend.mockReturnValue('gnome_libsecret');
        mockSafeStorage.encryptString.mockReset();
        mockSafeStorage.decryptString.mockReset();
        mockIsLinux.mockReturnValue(false);
    });

    it('returns an error when encryption is unavailable', () => {
        mockSafeStorage.isEncryptionAvailable.mockReturnValue(false);

        expect(isSafeStorageEncryptionAvailable()).toStrictEqual(
            err(EncryptionUnavailable('SafeStorage encryption is not available')),
        );
    });

    it('returns an error on Linux when the storage backend is unavailable', () => {
        mockIsLinux.mockReturnValue(true);
        delete mockSafeStorage.getSelectedStorageBackend;

        expect(isSafeStorageEncryptionAvailable()).toStrictEqual(
            err(
                EncryptionUnavailable(
                    'SafeStorage#getSelectedStorageBackend is not available on Linux',
                ),
            ),
        );
    });

    it('allows missing storage backend lookup on non-Linux platforms', () => {
        delete mockSafeStorage.getSelectedStorageBackend;

        expect(isSafeStorageEncryptionAvailable()).toStrictEqual(ok());
    });

    it('returns an error when the selected backend is basic_text', () => {
        mockGetSelectedStorageBackend.mockReturnValue('basic_text');

        expect(isSafeStorageEncryptionAvailable()).toStrictEqual(
            err(EncryptionUnavailable('Storage Backend is "basic_text", not secure')),
        );
    });

    it('encrypts a value to hex', () => {
        mockSafeStorage.encryptString.mockReturnValue(Buffer.from('encrypted-value'));

        expect(encryptToSafeStorage('plaintext')).toStrictEqual(
            ok(Buffer.from('encrypted-value').toString('hex')),
        );
    });

    it('decrypts a value from hex', () => {
        mockSafeStorage.decryptString.mockReturnValue('plaintext');

        expect(
            decryptFromSafeStorage(Buffer.from('encrypted-value').toString('hex')),
        ).toStrictEqual(ok('plaintext'));
    });

    it('returns a decryption error when decryptString throws', () => {
        mockSafeStorage.decryptString.mockImplementation(() => {
            throw new Error('Decryption failed');
        });

        expect(decryptFromSafeStorage('invalid-hex')).toStrictEqual(err(DecryptionFailed()));
    });

    it('encrypts booleans as encrypted store values', () => {
        mockSafeStorage.encryptString.mockReturnValue(Buffer.from('encrypted-bool'));

        expect(encryptStoredPrimitiveValue(true)).toBe(
            `safeStorage:encrypted:${Buffer.from('encrypted-bool').toString('hex')}`,
        );
    });

    it('falls back to branded plaintext string values when encryption fails', () => {
        mockSafeStorage.isEncryptionAvailable.mockReturnValue(false);

        expect(encryptStoredPrimitiveValue('token')).toBe('safeStorage:plaintext:token');
    });

    it('returns legacy plaintext values as-is', () => {
        expect(
            decryptStoredPrimitiveValue({
                rawValue: 'legacy-token',
                defaultValue: undefined,
            }),
        ).toBe('legacy-token');
    });

    it('decrypts stored plaintext wrapper values', () => {
        expect(
            decryptStoredPrimitiveValue({
                rawValue: 'safeStorage:plaintext:token' as SafeStoragePlaintextValue,
                defaultValue: undefined,
            }),
        ).toBe('token');
    });

    it('returns the fallback boolean when encrypted data cannot be decrypted', () => {
        mockSafeStorage.decryptString.mockImplementation(() => {
            throw new Error('Decryption failed');
        });

        expect(
            decryptStoredPrimitiveValue({
                rawValue:
                    `safeStorage:encrypted:${Buffer.from('encrypted-bool').toString('hex')}` as SafeStorageEncryptedValue,
                defaultValue: true,
            }),
        ).toBe(true);
    });

    it('wraps onDidChange callbacks with decrypted values', () => {
        mockSafeStorage.decryptString.mockReturnValue('secret-token');
        const callback = jest.fn();
        const wrappedCallback = wrapOnDidChangeWithDecryptedValues<
            string | SafeStorageEncryptedValue | SafeStoragePlaintextValue,
            string
        >({
            decryptValue: value =>
                decryptStoredPrimitiveValue({
                    rawValue: value,
                    defaultValue: undefined,
                }),
            callback,
        });

        wrappedCallback(
            `safeStorage:encrypted:${Buffer.from('encrypted-token').toString('hex')}` as SafeStorageEncryptedValue,
            'safeStorage:plaintext:old-token' as SafeStoragePlaintextValue,
        );

        expect(callback).toHaveBeenCalledWith('secret-token', 'old-token');
    });
});
