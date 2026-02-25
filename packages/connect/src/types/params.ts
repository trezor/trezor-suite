// API params

import { SerializedError } from '@trezor/connect-common/src/constants/errors';
import { Static, TSchema, Type } from '@trezor/schema-utils';
import { Err, Ok } from '@trezor/type-utils';

import { DeviceState, DeviceUniquePath } from './device';

export interface DeviceIdentity {
    path?: DeviceUniquePath;
    state?: DeviceState;
    instance?: number;
}

export interface CommonParams {
    device?: DeviceIdentity & { useEmptyPassphrase?: boolean };
    keepSession?: boolean;
    useCardanoDerivation?: boolean;
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
    coin: string;
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

// replace type `T` address_n field type `A` with address_n type `R`
type ProtoWithExtendedAddressN<T, A, R> = Omit<Extract<T, { address_n: A }>, 'address_n'> & {
    address_n: R;
};
type ProtoWithoutAddressN<T, A> = Exclude<T, { address_n: A }>;

// replace address_n: number[] with address_n: DerivationPath
export type ProtoWithDerivationPath<T> =
    | ProtoWithoutAddressN<T, number[]>
    | ProtoWithExtendedAddressN<T, number[], DerivationPath>;

// unwrap original generic PROTO type from the replacement
export type ProtoWithAddressN<P extends ProtoWithDerivationPath<any>> =
    P extends ProtoWithDerivationPath<infer T> ? T : unknown;

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
    publicKey: Type.String(),
    path: Type.Array(Type.Number()),
    serializedPath: Type.String(),
});
