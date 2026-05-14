import { type Branded } from '@trezor/type-utils';

import { type DEVICE_TYPE } from '../constants';
import type { DescriptorModel } from '../utils/descriptor';

export type * from './apiCall';

export type Session = `${number}` & Branded<'Session'>;
export const Session = (input: `${number}`) => `${input}` as Session;
export type PathInternal = string & Branded<'PathInternal'>;
export const PathInternal = (input: string) => input as PathInternal;
export type PathPublic = `${number}` & Branded<'PathPublic'>;
export const PathPublic = (input: `${number}`) => `${input}` as PathPublic;

export type ApiType = 'usb' | 'bluetooth' | 'udp';

export type DescriptorApiLevel = {
    path: PathInternal;
    /** only used in status page */
    type: DEVICE_TYPE;
    /** only important for T1 over old bridge (trezord-go), defacto part of 'path'. More explanation in https://github.com/trezor/trezor-suite/compare/transport-descriptor-product */
    product?: number;
    /** only reported by old bridge */
    vendor?: number;
    apiType: ApiType;
    /** api level device id.  */
    id?: string | null;
    /** api level device model */
    model?: DescriptorModel;
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
