// API params

import type { Static, TSchema } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';
import type { Err, Ok } from '@trezor/type-utils';

import type { CoinSymbol } from './coinInfo';
import type { DeviceState, DeviceUniquePath } from './device';
import type { SerializedError } from '../constants/errors';

export interface DeviceIdentity {
    path?: DeviceUniquePath;
    state?: DeviceState;
    instance?: number;
}

export interface CommonParams {
    device?: DeviceIdentity & { useEmptyPassphrase?: boolean };
    keepSession?: boolean;
    /**
     * Client-provided correlation token forwarded to related UI events during this call.
     * Must be a valid UUID; the method validator throws `Method_InvalidParameter` otherwise.
     */
    callId?: string;
    /**
     * internal flag. if set to true, call will only return info about the method, not execute it.
     * todo: this should be moved to another argument instead of mixing this with params
     */
    __info?: boolean;
    /**
     * internal flag, only effective if `__info` is set to true.
     * if set to true, the method will return precomposed result, which is used in suite
     */
    __precomposed?: boolean;
}

export type Params<T> = CommonParams & T & { bundle?: undefined };

interface Bundle<T> {
    bundle: T[];
}
export const Bundle = <T extends TSchema>(type: T) =>
    Type.Object({ bundle: Type.Array(type, { minItems: 1 }) });

export type BundledParams<T> = CommonParams & Bundle<T>;

export interface CommonParamsWithCoin extends CommonParams {
    coin: CoinSymbol;
    identity?: string; // ensures that different backend connections are opened for different identities
}

export interface OkWithDevice<T> extends Ok<T> {
    device?: DeviceIdentity;
}

export type Response<T> = Promise<OkWithDevice<T> | Err<SerializedError>>;

export type DerivationPath = string | number[];
export const DerivationPath = Type.Union([Type.String(), Type.Array(Type.Number())], {
    description: 'Derivation Path (BIP32).',
    $id: 'DerivationPath',
});

// Marker fragment intersected into payloads of methods that require explicit
// opt-in via `__experimental: true`.
export type ExperimentalMethod = Static<typeof ExperimentalMethod>;
export const ExperimentalMethod = Type.Object({
    __experimental: Type.Literal(true),
});

// replace type `T` address_n field type `A` with address_n type `R`
type ProtoWithExtendedAddressN<T, A, R> = Omit<Extract<T, { address_n: A }>, 'address_n'> & {
    address_n: R;
};
type ProtoWithoutAddressN<T, A> = Exclude<T, { address_n: A }>;

// replace address_n: number[] with address_n: DerivationPath
export type ProtoWithDerivationPath<T> =
    | ProtoWithoutAddressN<T, number[]>
    | ProtoWithExtendedAddressN<T, number[], DerivationPath>;

// Common fields for all *.getAddress methods
export type GetAddress = Static<typeof GetAddress>;
export const GetAddress = Type.Object({
    path: DerivationPath,
    address: Type.Optional(Type.String()),
    showOnTrezor: Type.Optional(Type.Boolean({ default: true })),
    chunkify: Type.Optional(Type.Boolean()),
});

export interface Address {
    address: string;
    path: number[];
    serializedPath: string;
    mac?: string;
}

// Common fields for all *.getPublicKey methods
export type GetPublicKey = Static<typeof GetPublicKey>;
export const GetPublicKey = Type.Object({
    path: DerivationPath,
    showOnTrezor: Type.Optional(Type.Boolean()),
    suppressBackupWarning: Type.Optional(Type.Boolean()),
    chunkify: Type.Optional(Type.Boolean()),
});

export type PublicKey = Static<typeof PublicKey>;
export const PublicKey = Type.Object({
    /**
     * Per-coin raw public key encoding:
     * - Bitcoin/Ethereum: hex-encoded compressed public key (33 bytes)
     * - Solana/Cardano: hex-encoded raw public key (32 bytes)
     * - Tezos: base58check-encoded public key (`edpk…`)
     */
    publicKey: Type.String(),
    path: Type.Array(Type.Number()),
    serializedPath: Type.String(),
    /**
     * Canonical user-facing representation of the public key for the given coin.
     * - Bitcoin: `xpubSegwit ?? xpub` (SLIP-132 form matching the requested
     *   scriptType, e.g. ypub/zpub for SegWit, `tr(...)` descriptor for Taproot)
     * - Ethereum: hex-encoded compressed public key (same value as `publicKey`)
     * - Cardano: extended public key (xpub)
     * - Solana: base58-encoded address (same value as `publicKeyBase58`)
     * - Tezos: base58check-encoded public key, `edpk…` (same value as `publicKey`)
     *
     * Generic consumers (e.g. UI components that need to display *some* canonical
     * identifier without knowing the coin) should read this field. Coin-specific
     * consumers should read the per-coin response type instead, which exposes the
     * fields that genuinely apply to that coin (e.g. `xpub`, `xpubSegwit`,
     * `publicKeyBase58`, `node`).
     *
     * Relation to what firmware shows on the device screen for
     * `showOnTrezor: true`:
     * - Bitcoin (legacy/SegWit), Cardano, Solana, Tezos: byte-identical to the
     *   firmware display.
     * - Bitcoin Taproot: same logical descriptor, but firmware renders the bare
     *   account-level form with `h`-notation (e.g. `tr([fp/86h/0h/0h]xpub…)`),
     *   while this field is the BIP-389 multipath descriptor with `'`-notation
     *   and trailing `/<0;1>/*` used to derive both external and change
     *   addresses (e.g. `tr([fp/86'/0'/0']xpub…/<0;1>/*)`).
     * - Ethereum: byte-identical to the raw compressed public key (`publicKey`,
     *   33 bytes hex) shown by firmware.
     */
    displayablePublicKey: Type.String(),
});
