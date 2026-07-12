// Branded types for THP key material: nominally distinct at compile time so a
// public key cannot be passed where a credential (or a private key) is expected.
// Zero runtime footprint (`Branded` is a phantom field) — plain `string`/`Buffer`
// at runtime. Each brand is applied at its point of creation via its `asX()` helper.

import type { Branded } from '@trezor/type-utils';

export type HostStaticKey = Buffer & Branded<'HostStaticKey'>;
export type HostStaticKeyHex = string & Branded<'HostStaticKey'>;

export type HostStaticPublicKey = Buffer & Branded<'HostStaticPublicKey'>;
export type HostStaticPublicKeyHex = string & Branded<'HostStaticPublicKey'>;

export type TrezorStaticPublicKey = string & Branded<'TrezorStaticPublicKey'>;

export type ThpCredentialId = string & Branded<'ThpCredentialId'>;

export const asHostStaticKey = (value: Buffer): HostStaticKey => value as HostStaticKey;
export const asHostStaticKeyHex = (value: string): HostStaticKeyHex => value as HostStaticKeyHex;
export const asHostStaticPublicKey = (value: Buffer): HostStaticPublicKey =>
    value as HostStaticPublicKey;
export const asHostStaticPublicKeyHex = (value: string): HostStaticPublicKeyHex =>
    value as HostStaticPublicKeyHex;
export const asTrezorStaticPublicKey = (value: string): TrezorStaticPublicKey =>
    value as TrezorStaticPublicKey;
export const asThpCredentialId = (value: string): ThpCredentialId => value as ThpCredentialId;
