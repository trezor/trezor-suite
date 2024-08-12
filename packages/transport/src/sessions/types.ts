import type { AcquireInput } from '../transports/abstract';
import type {
    Descriptor,
    DescriptorApiLevel,
    ResultWithTypedError,
    Session,
    Success,
} from '../types';
import * as ERRORS from '../errors';

type BackgroundResponseWithError<T, E> = ResultWithTypedError<T, E> & { id: number };
type BackgroundResponse<T> = Success<T> & { id: number };

export type Sessions = Record<string, Descriptor>;

export type HandshakeRequest = Record<string, never>;
export type HandshakeResponse = BackgroundResponse<undefined>;

export type EnumerateDoneRequest = {
    descriptors: DescriptorApiLevel[];
};

export type EnumerateDoneResponse = BackgroundResponse<{
    descriptors: Descriptor[];
}>;

export type AcquireIntentRequest = AcquireInput;

export type AcquireIntentResponse = BackgroundResponseWithError<
    { session: Session },
    typeof ERRORS.SESSION_WRONG_PREVIOUS | typeof ERRORS.DESCRIPTOR_NOT_FOUND
>;

export type AcquireDoneRequest = {
    path: string;
};

export type AcquireDoneResponse = BackgroundResponseWithError<
    {
        session: Session;
        descriptors: Descriptor[];
    },
    typeof ERRORS.DESCRIPTOR_NOT_FOUND
>;
export interface ReleaseIntentRequest {
    session: Session;
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
    descriptors: Descriptor[];
}>;
export interface GetPathBySessionRequest {
    session: Session;
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
    enumerateIntent: () => BackgroundResponse<void>;
    enumerateDone: (payload: EnumerateDoneRequest) => EnumerateDoneResponse;
    acquireIntent: (payload: AcquireIntentRequest) => AcquireIntentResponse;
    acquireDone: (payload: AcquireDoneRequest) => AcquireDoneResponse;
    releaseIntent: (payload: ReleaseIntentRequest) => ReleaseIntentResponse;
    releaseDone: (payload: ReleaseDoneRequest) => ReleaseDoneResponse;
    getSessions: () => GetSessionsResponse;
    getPathBySession: (payload: GetPathBySessionRequest) => GetPathBySessionResponse;
    dispose: () => BackgroundResponse<void>;
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
