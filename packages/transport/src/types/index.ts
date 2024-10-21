import type { DEVICE_TYPE } from '../api/abstract';

export * from './apiCall';

export type Session = `${number}` & { __type: 'Session' };
export const Session = (input: `${number}`) => {
    return `${input}` as Session;
};
export type PathInternal = string & { __type: 'PathInternal' };
export const PathInternal = (input: string) => {
    return input as PathInternal;
};
export type PathPublic = `${number}` & { __type: 'PathPublic' };
export const PathPublic = (input: `${number}`) => {
    return `${input}` as PathPublic;
};

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
    /** extension of 'session'. If session is defined then also sessionOwner must be defined. Describes which other application is using the session. */
    sessionOwner?: string;
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
