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

export type EncryptionError = EncryptionUnavailable;
export type DecryptionError = EncryptionUnavailable | DecryptionFailed;

export type PlatformEncryptionDep = { platformEncryption: PlatformEncryption };

export interface PlatformEncryption {
    encrypt: <T extends EncryptableBranded>(params: {
        value: T;
    }) => Promise<Result<EncryptedHex<T>, EncryptionError>>;

    decrypt: <T extends EncryptableBranded>(params: {
        value: EncryptedHex<T>;
    }) => Promise<Result<T, DecryptionError>>;
}
