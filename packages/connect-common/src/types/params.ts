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

/**
 * Method accepting a single request, or a `bundle` of requests answered with an array of results.
 */
export type BundleableMethod<T, R> = {
    (params: Params<T>): Response<R>;
    (params: BundledParams<T>): Response<R[]>;
};

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
    ProtoWithoutAddressN<T, number[]> | ProtoWithExtendedAddressN<T, number[], DerivationPath>;

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
     * The public key exactly as the device shows it for `showOnTrezor: true`.
     * - Bitcoin: the xpub in the SLIP-132 form matching the requested scriptType
     *   (e.g. ypub/zpub for SegWit). For Taproot, firmware's descriptor with
     *   `h`-notation and checksum (same value as `descriptor`), e.g.
     *   `tr([fp/86h/0h/0h]xpub…/<0;1>/*)#checksum`; firmware older than core 2.7.0
     *   or legacy 1.14.0 sends no descriptor and shows the bare `xpub`. Backends
     *   take the `'`-notation descriptor in `xpubSegwit`.
     * - Ethereum: hex-encoded compressed public key (same value as `publicKey`).
     *   Trezor Model One shows it in upper case with the last byte cut off.
     * - Cardano: extended public key (xpub); firmware older than 2.6.1 shows only
     *   the public key, which is then the value here
     * - Solana: base58-encoded address (same value as `publicKeyBase58`)
     * - Tezos: base58check-encoded public key, `edpk…` (same value as `publicKey`)
     *
     * Generic consumers (e.g. UI components that show the key next to an on-device
     * verification without knowing the coin) should read this field. Coin-specific
     * consumers, and anything that passes the key to a backend, should read the
     * per-coin response type instead, which exposes the fields that genuinely apply
     * to that coin (e.g. `xpub`, `xpubSegwit`, `publicKeyBase58`, `node`).
     */
    displayablePublicKey: Type.String(),
});
