import type { AcquireInput } from '../transports/abstract';
import type { Session, Descriptor, ResultWithTypedError, Success } from '../types';
import * as ERRORS from '../errors';

type BackgroundResponseWithError<T, E> = ResultWithTypedError<T, E> & { id: number };
type BackgroundResponse<T> = Success<T> & { id: number };

export type Sessions = Record<string, Session | undefined>;

export type HandshakeRequest = Record<string, never>;
export type HandshakeResponse = BackgroundResponse<undefined>;

export type EnumerateIntentRequest = Record<string, never>;
export type EnumerateIntentResponse = BackgroundResponse<{
    sessions: Sessions;
}>;

export type EnumerateDoneRequest = {
    paths: string[];
};

export type EnumerateDoneResponse = BackgroundResponse<{
    sessions: Sessions;
    descriptors: Descriptor[];
}>;

export type AcquireIntentRequest = AcquireInput;

export type AcquireIntentResponse = BackgroundResponseWithError<
    { session: string },
    typeof ERRORS.SESSION_WRONG_PREVIOUS
>;

export type AcquireDoneRequest = {
    path: string;
};

export type AcquireDoneResponse = BackgroundResponse<{
    session: string;
    descriptors: Descriptor[];
}>;
export interface ReleaseIntentRequest {
    session: string;
}

export type ReleaseIntentResponse = BackgroundResponseWithError<
    { path: string },
    typeof ERRORS.SESSION_NOT_FOUND
>;

export interface ReleaseDoneRequest {
    path: string;
}

export type ReleaseDoneResponse = BackgroundResponse<{
    descriptors: Descriptor[];
}>;

export type GetSessionsRequest = Record<string, never>;
export type GetSessionsResponse = BackgroundResponse<{
    sessions: Sessions;
}>;
export interface GetPathBySessionRequest {
    session: string;
}

export type GetPathBySessionResponse = BackgroundResponseWithError<
    {
        path: string;
    },
    typeof ERRORS.SESSION_NOT_FOUND
>;

export type Params = {
    /* caller is used for identification/debugging */
    caller?: string;
    /* id is used for request - response pairing */
    id?: number;
};

export interface HandleMessageApi {
    handshake: () => HandshakeResponse;
    enumerateIntent: () => EnumerateIntentResponse;
    enumerateDone: (payload: EnumerateDoneRequest) => EnumerateDoneResponse;
    acquireIntent: (payload: AcquireIntentRequest) => AcquireIntentResponse;
    acquireDone: (payload: AcquireDoneRequest) => AcquireDoneResponse;
    releaseIntent: (payload: ReleaseIntentRequest) => ReleaseIntentResponse;
    releaseDone: (payload: ReleaseDoneRequest) => ReleaseDoneResponse;
    getSessions: () => GetSessionsResponse;
    getPathBySession: (payload: GetPathBySessionRequest) => GetPathBySessionResponse;
}

type UnwrapParams<T, Fn> = Fn extends () => any
    ? Params & { type: T }
    : Fn extends (payload: infer P) => any
    ? Params & { type: T; payload: P }
    : never;

type UnwrappedParams = {
    [K in keyof HandleMessageApi]: UnwrapParams<K, HandleMessageApi[K]>;
};

export type HandleMessageParams = UnwrappedParams[keyof UnwrappedParams];

export type HandleMessageResponse<P> = P extends { type: infer T }
    ? T extends keyof HandleMessageApi
        ? ReturnType<HandleMessageApi[T]>
        : never
    : never;

export type RegisterBackgroundCallbacks = (
    onDescriptorsCallback: (args: Descriptor[]) => void,
) => void;
