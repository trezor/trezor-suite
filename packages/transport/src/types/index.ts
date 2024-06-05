import { DEVICE_TYPE } from '../api/abstract';

export * from './apiCall';

export type Session = `${number}`;

export type DescriptorApiLevel = {
    path: string;
    /** only used in status page */
    type?: DEVICE_TYPE;
    /** only important for T1 over old bridge (trezord-go), defacto part of 'path'. More explanation in https://github.com/trezor/trezor-suite/compare/transport-descriptor-product */
    product?: number;
};

export type Descriptor = DescriptorApiLevel & {
    session: null | Session;
};

export interface Logger {
    debug(...args: any): void;
    log(...args: any): void;
    warn(...args: any): void;
    error(...args: any): void;
}
