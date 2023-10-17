// API params

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
export interface GetAddress {
    path: DerivationPath;
    address?: string;
    showOnTrezor?: boolean;
    chunkify?: boolean;
}

export interface Address {
    address: string;
    path: number[];
    serializedPath: string;
}

// Common fields for all *.getPublicKey methods
export interface GetPublicKey {
    path: DerivationPath;
    showOnTrezor?: boolean;
    suppressBackupWarning?: boolean;
    chunkify?: boolean;
}

export interface PublicKey {
    publicKey: string;
    path: number[];
    serializedPath: string;
}
