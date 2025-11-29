import { Branded, BrandedArity2, Result } from '@trezor/type-utils';

export type EncryptableBranded = string & Branded<string>;

export type EncryptedHex<T extends EncryptableBranded> = string & BrandedArity2<'EncryptedHex', T>;
export const asEncryptedHex = <T extends EncryptableBranded>(id: T) =>
    id as unknown as EncryptedHex<T>;

export type EncryptionUnavailable = {
    type: 'EncryptionUnavailable';
    message: string;
};

export const EncryptionUnavailable = (message: string) => ({
    type: 'EncryptionUnavailable',
    message,
});

export interface SecureStorage {
    encrypt: <T extends EncryptableBranded>(params: {
        value: T;
    }) => Promise<Result<EncryptedHex<T>, EncryptionUnavailable>>;

    decrypt: <T extends EncryptableBranded>(params: {
        value: EncryptedHex<T>;
    }) => Promise<Result<T, EncryptionUnavailable>>;
}
