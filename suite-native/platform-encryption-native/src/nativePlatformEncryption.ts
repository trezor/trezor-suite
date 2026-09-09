import * as crypto from 'crypto';

import {
    DecryptionFailed,
    type EncryptableBranded,
    type EncryptedHex,
    EncryptionUnavailable,
    type PlatformEncryption,
    asEncryptedHex,
} from '@suite-common/platform-encryption';
import { type EnsureEncryptionKeyDep } from '@suite-native/storage';
import { err, ok } from '@trezor/type-utils';

const CIPHER_TYPE = 'aes-256-gcm';
const IV_SIZE = 96 / 8;
const AUTH_TAG_SIZE = 128 / 8;

type NativePlatformEncryptionDeps = EnsureEncryptionKeyDep;

// Derive 256-bit key from 128-bit MMKV key using SHA-256
const deriveKey = (mmkvKey: string): Buffer =>
    crypto.createHash('sha256').update(mmkvKey, 'hex').digest();

export const createNativePlatformEncryption = (
    deps: NativePlatformEncryptionDeps,
): PlatformEncryption => ({
    encrypt: async <T extends EncryptableBranded>({ value }: { value: T }) => {
        const encryptionKey = await deps.ensureEncryptionKey();

        if (encryptionKey === null) {
            return err(EncryptionUnavailable('Encryption key not available'));
        }

        try {
            const key = deriveKey(encryptionKey);
            const iv = crypto.randomBytes(IV_SIZE);
            const cipher = crypto.createCipheriv(CIPHER_TYPE, key, iv);

            const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
            const authTag = cipher.getAuthTag();

            // Format: IV (12 bytes) + authTag (16 bytes) + ciphertext
            const result = Buffer.concat([iv, authTag, encrypted]);

            return ok(asEncryptedHex<T>(result.toString('hex')));
        } catch {
            return err(EncryptionUnavailable('Encryption failed'));
        }
    },

    decrypt: async <T extends EncryptableBranded>({ value }: { value: EncryptedHex<T> }) => {
        const encryptionKey = await deps.ensureEncryptionKey();

        if (encryptionKey === null) {
            return err(EncryptionUnavailable('Encryption key not available'));
        }

        try {
            const key = deriveKey(encryptionKey);
            const input = Buffer.from(value, 'hex');

            const iv = input.subarray(0, IV_SIZE);
            const authTag = input.subarray(IV_SIZE, IV_SIZE + AUTH_TAG_SIZE);
            const ciphertext = input.subarray(IV_SIZE + AUTH_TAG_SIZE);

            const decipher = crypto.createDecipheriv(CIPHER_TYPE, key, iv);
            decipher.setAuthTag(authTag);

            const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

            return ok(decrypted.toString('utf8') as T);
        } catch {
            // Could be wrong key or tampered data, cryptographically indistinguishable by design.
            return err(DecryptionFailed());
        }
    },
});
