export type HttpRequestType = 'text' | 'binary' | 'json';

export type HttpRequestReturnType<T extends HttpRequestType> = T extends 'text'
    ? string
    : T extends 'binary'
      ? ArrayBuffer | Buffer
      : T extends 'json'
        ? Record<string, any>
        : never;

export interface HttpRequestOptions extends RequestInit {
    skipLocalForceDownload?: boolean;
}
