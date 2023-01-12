import type { AcquireInput } from '../transports/abstract';

export type EnumerateDone = {
    paths: string[];
};

export type AcquireIntent = AcquireInput;
export interface AcquireDone {
    path: string;
}

export interface ReleaseIntent {
    session: string;
}
export interface ReleaseDone {
    path: string;
}

export interface GetPathBySession {
    session: string;
}
