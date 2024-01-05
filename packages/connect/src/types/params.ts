// API params

import { Type, TSchema, Static } from '@trezor/schema-utils';

export interface CommonParams {
    device?: {
        path?: string;
        state?: string;
        instance?: number;
    };
    useEmptyPassphrase?: boolean;
    useEventListener?: boolean; // this param is set automatically in factory
    allowSeedlessDevice?: boolean;
    keepSession?: boolean;
    override?: boolean;
    skipFinalReload?: boolean;
    useCardanoDerivation?: boolean;
    chunkify?: boolean;
}

export type Params<T> = CommonParams & T & { bundle?: undefined };

interface Bundle<T> {
    bundle: T[];
}
export const Bundle = <T extends TSchema>(type: T) => Type.Object({ bundle: Type.Array(type) });

export type BundledParams<T> = CommonParams & Bundle<T>;

export interface CommonParamsWithCoin extends CommonParams {
    coin: string;
}

export interface Unsuccessful {
    success: false;
    payload: { error: string; code?: string };
}

export interface Success<T> {
    success: true;
    payload: T;
}

export type Response<T> = Promise<Success<T> | Unsuccessful>;

export type DerivationPath = string | number[];
export const DerivationPath = Type.Union([Type.String(), Type.Array(Type.Number())]);

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
    showOnTrezor: Type.Optional(Type.Boolean()),
    chunkify: Type.Optional(Type.Boolean()),
    useEventListener: Type.Optional(Type.Boolean()),
});

export interface Address {
    address: string;
    path: number[];
    serializedPath: string;
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
