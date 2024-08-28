import * as crypto from 'crypto';

export const aesgcm = (key: Buffer, iv: Buffer) => {
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);

    return {
        auth: (authData: Buffer) => {
            cipher.setAAD(authData);
            decipher.setAAD(authData);
        },
        encrypt: (plainText: Buffer) => {
            const encrypted = cipher.update(plainText);

            return Buffer.concat([encrypted, cipher.final()]);
        },
        decrypt: (cipherText: Buffer, authTag: Buffer) => {
            decipher.setAuthTag(authTag);
            const decrypted = decipher.update(cipherText);

            return Buffer.concat([decrypted, decipher.final()]);
        },
        finish: () => {
            return cipher.getAuthTag();
        },
    };
};
