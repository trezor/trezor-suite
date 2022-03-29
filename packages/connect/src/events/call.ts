import type { TrezorConnect } from '../types/api';
import type { Response } from '../types/params';

// unwrap TrezorConnect api method Success<T> response
type UnwrappedResponse<T> = T extends Promise<infer R>
    ? R extends { success: true; payload: infer P }
        ? P
        : never
    : never;

// https://github.com/microsoft/TypeScript/issues/32164
// there is no native way how to get Parameters<Fn> for overloaded function
// current TrezorConnect api methods have exactly 2 overloads (if any)
type OverloadedMethod<T> = T extends {
    (params: infer P1): infer R1;
    (params: infer P2): infer R2;
}
    ? ((params: P1) => UnwrappedResponse<R1>) | ((params: P2) => UnwrappedResponse<R2>)
    : never;

// unwrap TrezorConnect api method to format:
// (params: GetAddressParams) => GetAddressResponse;
type UnwrappedMethod<T> = OverloadedMethod<T> extends never
    ? T extends (...args: infer P) => infer R
        ? (...args: P) => UnwrappedResponse<R>
        : never
    : OverloadedMethod<T>;

// TODO: exclude on/off/removelistener
// TODO: no args (dispose)
// map TrezorConnect api with unwrapped methods
type UnwrappedApi = {
    [K in keyof TrezorConnect]: UnwrappedMethod<TrezorConnect[K]>;
};

// type Foo = UnwrappedApi['ethereumSignTypedData'];

export type _CallMessage<T extends keyof TrezorConnect> = {
    method: T;
} & Parameters<UnwrappedApi[T]>[number];

export type _Call1<T extends keyof TrezorConnect> = <R>(params: _CallMessage<T>) => R;
export type _Call = <M extends keyof TrezorConnect, R extends Response<any>>(
    params: _CallMessage<M>,
) => R;

// export type Call = _Call<keyof TrezorConnect>;
export type Call = _Call;
export type CallMessage = _CallMessage<keyof TrezorConnect>;

// const foo = (m: CallMessage) => {
//     const n: _CallMessage = {
//         method: 'binanceGetAddress',
//     };
//     if (m.method === 'getAddress') {
//         // m.path =
//         // m.path
//     }
//     return n;
// };

// const foo = (call: _Call) => {
//     call({ method: 'ethereumSignTypedData', path: 'm', domain_separator_hash: '' });
//     call({ method: 'getAddress', bundle: [{ path: '' }] });
// };

// [keyof Fn] extends
//    (x: infer I) => void ? { [K in keyof I]: I[K] } : never;

// [K in keyof TrezorConnect] extends
// (x: infer I) => void ? I : never;

// export type MethodMessage<K extends keyof TrezorConnect> = {
//     method: K;
//     // params: Pars;
//     params: Parameters<TrezorConnect[K]>;
// };

// type DetailedEvent<Event> = Event extends { type: string }
//     ? Event extends { payload: any }
//         ? (type: Event['type'], cb: (event: Event['payload']) => any) => void
//         : (type: Event['type'], cb: () => any) => void
//     : never;

// export declare const call: UnionToIntersection<EventsUnion>;

// export type IframeCall =
//     | {
//           event: typeof IFRAME.CALL;
//           type: typeof IFRAME.CALL;
//           payload: CallMessage;
//       }
//     | {
//           event: typeof TRANSPORT.DISABLE_WEBUSB;
//           type: typeof TRANSPORT.DISABLE_WEBUSB;
//           payload: any;
//       };

// export const f = (c: IframeCall) => {
//     c.payload.method;
//     c.payload.params[0].
// };
