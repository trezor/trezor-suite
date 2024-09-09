import type { DEVICE_TYPE } from '../api/abstract';

export * from './apiCall';

export type Session = `${number}`;

export type PathInternal = string;
export type PathPublic = `${number}`;

export type DescriptorApiLevel = {
    path: PathInternal;
    /** only used in status page */
    type: DEVICE_TYPE;
    /** only important for T1 over old bridge (trezord-go), defacto part of 'path'. More explanation in https://github.com/trezor/trezor-suite/compare/transport-descriptor-product */
    product?: number;
    /** only reported by old bridge */
    vendor?: number;
};

export type Descriptor = Omit<DescriptorApiLevel, 'path'> & {
    path: PathPublic;
    session: null | Session;
    /** only reported by old bridge */
    debugSession?: null | Session;
    /** only reported by old bridge */
    debug?: boolean;
};

export interface Logger {
    info(...args: any): void;
    debug(...args: any): void;
    log(...args: any): void;
    warn(...args: any): void;
    error(...args: any): void;
}
