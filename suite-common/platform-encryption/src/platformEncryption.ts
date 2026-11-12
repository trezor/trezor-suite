import { type Branded, type BrandedArity2, type Result } from '@trezor/type-utils';

export type EncryptableBranded = string & Branded<string>;

export type EncryptedHex<T extends EncryptableBranded> = string & BrandedArity2<'EncryptedHex', T>;
export const asEncryptedHex = <T extends EncryptableBranded>(value: string) =>
    value as EncryptedHex<T>;

export type EncryptionUnavailable = {
    type: 'EncryptionUnavailable';
    message: string;
};

export const EncryptionUnavailable = (message: string): EncryptionUnavailable => ({
    type: 'EncryptionUnavailable' as const,
    message,
});

export type DecryptionFailed = {
    type: 'DecryptionFailed';
};

export const DecryptionFailed = (): DecryptionFailed => ({
    type: 'DecryptionFailed' as const,
});

/** The key exists but cannot be used right now: the user declined, or a prompt was just refused. */
export type EncryptionLocked = {
    type: 'EncryptionLocked';
    message: string;
};

export const EncryptionLocked = (message: string): EncryptionLocked => ({
    type: 'EncryptionLocked' as const,
    message,
});

export type EncryptionError = EncryptionUnavailable | EncryptionLocked;
export type DecryptionError = EncryptionUnavailable | EncryptionLocked | DecryptionFailed;

export type PlatformEncryptionDep = { platformEncryption: PlatformEncryption };

export const injectPlatformEncryption = (services: any): PlatformEncryptionDep => ({
    platformEncryption: services.platformEncryption,
});

/** `context` binds the ciphertext to its use, e.g. the record type and id it is stored under. */
export type EncryptParams<T extends EncryptableBranded> = { value: T; context?: string };

export type DecryptParams<T extends EncryptableBranded> = {
    value: EncryptedHex<T>;
    context?: string;
};

/** @serviceContract */
export interface PlatformEncryption {
    encrypt: <T extends EncryptableBranded>(
        params: EncryptParams<T>,
    ) => Promise<Result<EncryptedHex<T>, EncryptionError>>;

    decrypt: <T extends EncryptableBranded>(
        params: DecryptParams<T>,
    ) => Promise<Result<T, DecryptionError>>;
}
