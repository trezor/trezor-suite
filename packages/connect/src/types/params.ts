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

// Common fields for all *.getAddress methods
export interface GetAddress {
    path: DerivationPath;
    address?: string;
    showOnTrezor?: boolean;
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
}

export interface PublicKey {
    publicKey: string;
    path: number[];
    serializedPath: string;
}
