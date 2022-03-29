// import type { TrezorConnect } from './api';

export * from './api';
export * from './account';
export * from './coinInfo';
export * from './device';
export * from './params';
export * from './settings';

// TODO: like this from all files?
// export type { ConnectSettings } from './api/init';
// export type { Manifest } from './api/manifest';

// export type ParamsOf<T extends keyof TrezorConnect> = Parameters<TrezorConnect[T]>;
// export type ResponseOf<T extends keyof TrezorConnect> = ReturnType<TrezorConnect[T]>;
// type Awaited<T> = T extends PromiseLike<infer U> ? U : T;
// export type DeferredResponse<D> = D extends ResponseOf<infer R> ? R : never;

// type F0 = ParamsOf<'applyFlags'>[0];
// type F = Extract<Awaited<ResponseOf<'getAddress'>>, { success: true }>['payload'];
// type F1 = ResponseOf<'getAddress'>;
// type F2 = TrezorConnect['getAddress'];

// export const f: F = {
//     message: '',
//     // flags: 1,
// };
