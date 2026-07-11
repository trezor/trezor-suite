// Branded types for THP key material.
//
// These keys (the host static key seed, the host static keypair, the credential
// identifier and the various static public keys) are all structurally just
// `string`/`Buffer` values, so nothing at the type level stops a host static
// public key from being passed where a credential is expected, or a public key
// from being swapped with a private key. Branding makes each key nominally
// distinct at compile time (with zero runtime footprint — `Branded` is a phantom
// field) while still being a plain `string`/`Buffer` at runtime, so branded
// values JSON round-trip through persistence unchanged.
//
// Each brand is applied at its point of creation via the paired `asX()` helper,
// so downstream consumers (which only read these fields) inherit the brand for
// free. See the existing `Branded` convention (`ProofOfDelegatedIdentity`,
// `DeviceUniquePath`, …) in `@trezor/connect-common`.

import type { Branded } from '@trezor/type-utils';

/** The host static key (secret) — the 32-byte seed / private key material. Buffer form. */
export type HostStaticKey = Buffer & Branded<'HostStaticKey'>;
/** Hex-string form of the host static key (`host_static_key` in `ThpCredentials`). */
export type HostStaticKeyHex = string & Branded<'HostStaticKey'>;

/** The host static public key. Buffer form. */
export type HostStaticPublicKey = Buffer & Branded<'HostStaticPublicKey'>;
/** Hex-string form of the host static public key (`host_static_public_key`). */
export type HostStaticPublicKeyHex = string & Branded<'HostStaticPublicKey'>;

/** The Trezor device's static public key. Hex string. */
export type TrezorStaticPublicKey = string & Branded<'TrezorStaticPublicKey'>;

/** A THP pairing credential identifier. Hex string. */
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
