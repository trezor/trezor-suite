/**
 * Greenfield sketch — wrap a single TrezorConnect method into a Process.
 *
 * Uses the package's local UiEvent shapes as the subprocess payload, only
 * augmenting them with our action methods (send / confirm / cancel).
 *
 * Call site:
 *
 *   const connect = createConnect({ trezorConnect: TrezorConnect });
 *   const getDeviceState = connect(TrezorConnect.getDeviceState);
 *   const process = getDeviceState({ device: { path }, useEmptyPassphrase: true });
 *
 *   process.id;
 *   for await (const sub of process.run()) {
 *       if (sub.type === 'ui-request_pin') sub.send('1234');
 *   }
 *   const result = await process.toPromise();
 *   process.cancel();
 */

import { UI_REQUEST, type UiEvent } from './trezorConnectLike';

// TrezorConnect emits both UI events and popup messages on the same
// `UI_EVENT` channel. Built from `UI_REQUEST` so any newly added UI variant
// is automatically recognised — this filter only rejects popup messages.
const UI_REQUEST_VALUES: ReadonlySet<string> = new Set(Object.values(UI_REQUEST));

const isLocalUiEvent = (event: { type?: unknown }): event is UiEvent =>
    typeof event.type === 'string' && UI_REQUEST_VALUES.has(event.type);

// Loose, structural shape of what we actually need from the trezorConnect dep.
// Real `TrezorConnect` (with its many `on` overloads) and the local
// `TrezorConnectLike` mock both satisfy this without casting.
interface ConnectDeps {
    on: (event: 'UI_EVENT', listener: (event: any) => void) => void;
    off: (event: 'UI_EVENT', listener: (event: any) => void) => void;
    uiResponse: (response: any) => void;
    cancel: (message?: string) => void;
}

// TrezorConnect's API methods are typically overloaded with a single-call and
// a bundled-call form (e.g. `getAddress`). `Parameters<M>` only sees the LAST
// overload, which would be the bundle. Pick the first overload so the
// caller-facing args type is the single-call shape.
type FirstOverload<F> = F extends {
    (...args: infer A): infer R;
    (...args: any[]): any;
}
    ? (...args: A) => R
    : F extends (...args: infer A) => infer R
      ? (...args: A) => R
      : never;

// Pull the success payload type out of whatever the method resolves to —
// works for both `{ success: true; payload: T }` (real connect & mock) and
// for `OkWithDevice<T>` (which is `Ok<T> & { device? }`).
type ExtractSuccess<R> = R extends { success: true; payload: infer T } ? T : never;

// Caller-facing args type: Parameters<M>[0] (first overload) minus callId.
type MethodArgs<M> =
    FirstOverload<M> extends (...args: any[]) => any
        ? Omit<NonNullable<Parameters<FirstOverload<M>>[0]>, 'callId'>
        : never;

type MethodResult<M> =
    FirstOverload<M> extends (...args: any[]) => infer R ? ExtractSuccess<Awaited<R>> : never;

// TrezorConnect uses `{ success: false; error }`; our mock uses
// `{ success: false; payload: { error } }`. Read either at runtime.
const extractErrorMessage = (result: unknown): string => {
    const r = result as { error?: unknown; payload?: { error?: unknown } } | undefined;
    if (r?.error) {
        if (typeof r.error === 'string') return r.error;
        if (typeof r.error === 'object' && r.error !== null && 'message' in r.error) {
            const { message } = r.error as { message?: unknown };
            if (typeof message === 'string') return message;
        }
    }
    if (typeof r?.payload?.error === 'string') return r.payload.error;

    return 'Unknown error';
};

type Augmentation<T extends UiEvent['type']> = T extends 'ui-request_pin'
    ? { send: (pin: string) => void }
    : T extends 'ui-request_passphrase'
      ? { send: (passphrase: string, options?: { save?: boolean }) => void }
      : T extends 'ui-request_confirmation'
        ? { confirm: (value: boolean) => void }
        : unknown;

type UiSubProcess = {
    [E in UiEvent as E['type']]: E &
        Augmentation<E['type']> & {
            cancel: () => void;
            callId: string;
        };
}[UiEvent['type']];

type SubProcess<TResult> =
    | UiSubProcess
    | { type: 'complete'; result: TResult; callId: string; cancel: () => void }
    | { type: 'error'; error: Error; callId: string; cancel: () => void };

interface Process<TResult> {
    readonly id: string;
    run(): AsyncIterableIterator<SubProcess<TResult>>;
    cancel(): void;
    toPromise(): Promise<TResult>;
}

let counter = 0;
const nextId = () => `connect-${Date.now()}-${++counter}`;

const createChannel = <T>() => {
    const buffer: T[] = [];
    const waiters: Array<(value: IteratorResult<T>) => void> = [];
    let closed = false;

    return {
        push(value: T) {
            if (closed) return;
            const waiter = waiters.shift();
            if (waiter) waiter({ value, done: false });
            else buffer.push(value);
        },
        close() {
            if (closed) return;
            closed = true;
            while (waiters.length) waiters.shift()!({ value: undefined as any, done: true });
        },
        [Symbol.asyncIterator]() {
            return {
                next: (): Promise<IteratorResult<T>> => {
                    if (buffer.length) {
                        return Promise.resolve({ value: buffer.shift()!, done: false });
                    }
                    if (closed) return Promise.resolve({ value: undefined as any, done: true });

                    return new Promise(resolve => waiters.push(resolve));
                },
            };
        },
    };
};

export const createConnect = (deps: { trezorConnect: ConnectDeps }) => {
    const { trezorConnect } = deps;

    const augment = <TResult>(
        event: UiEvent,
        callId: string,
        cancel: () => void,
    ): SubProcess<TResult> | undefined => {
        const base = { ...event, callId, cancel };
        const { requestId } = event;

        switch (event.type) {
            case 'ui-request_pin':
                return {
                    ...base,
                    send: (pin: string) =>
                        trezorConnect.uiResponse({
                            type: 'ui-receive_pin',
                            payload: pin,
                            requestId,
                        }),
                } as SubProcess<TResult>;

            case 'ui-request_passphrase':
                return {
                    ...base,
                    send: (passphrase: string, options?: { save?: boolean }) =>
                        trezorConnect.uiResponse({
                            type: 'ui-receive_passphrase',
                            payload: {
                                value: passphrase,
                                save: options?.save ?? false,
                                passphraseOnDevice: false,
                            },
                            requestId,
                        }),
                } as SubProcess<TResult>;

            case 'ui-request_confirmation':
                return {
                    ...base,
                    confirm: (value: boolean) =>
                        trezorConnect.uiResponse({
                            type: 'ui-receive_confirmation',
                            payload: value,
                            requestId,
                        }),
                } as SubProcess<TResult>;

            default:
                // Non-interactive UI event — pass through with `cancel`/`callId`
                // so the consumer can read the original payload (firmware
                // progress, bundle progress, button request data, etc.).
                return base as SubProcess<TResult>;
        }
    };

    const createProcess = <TResult>(
        id: string,
        invoke: (callId: string) => Promise<unknown>,
    ): Process<TResult> => {
        let started = false;
        let cancelled = false;
        let runCalled = false;

        const queue = createChannel<SubProcess<TResult>>();

        let resolveResult!: (value: TResult) => void;
        let rejectResult!: (error: Error) => void;
        const resultPromise = new Promise<TResult>((resolve, reject) => {
            resolveResult = resolve;
            rejectResult = reject;
        });
        resultPromise.catch(() => {});

        const cancelFn = () => {
            if (cancelled) return;
            cancelled = true;
            trezorConnect.cancel('Process cancelled');
            rejectResult(new Error('Process cancelled'));
            queue.close();
        };

        const onUiEvent = (event: UiEvent) => {
            if (event.callId !== id) return;
            // Drop events outside our local UiEvent model (firmware/bundle
            // progress, transport, etc.) before they reach `augment`. Keeps
            // the augment switch exhaustive at runtime, not just at compile
            // time, so consumers can rely on `exhaustive()` there.
            if (!isLocalUiEvent(event)) return;
            const sub = augment<TResult>(event, id, cancelFn);
            if (sub) queue.push(sub);
        };

        const start = () => {
            if (started) return;
            started = true;

            trezorConnect.on('UI_EVENT', onUiEvent);

            invoke(id)
                .then(result => {
                    const ok = result as { success?: boolean; payload?: unknown };
                    if (ok.success === true) {
                        const payload = ok.payload as TResult;
                        resolveResult(payload);
                        queue.push({
                            type: 'complete',
                            result: payload,
                            callId: id,
                            cancel: cancelFn,
                        });
                    } else {
                        const error = new Error(extractErrorMessage(result));
                        rejectResult(error);
                        queue.push({ type: 'error', error, callId: id, cancel: cancelFn });
                    }
                })
                .catch(err => {
                    const error = err instanceof Error ? err : new Error(String(err));
                    rejectResult(error);
                    queue.push({ type: 'error', error, callId: id, cancel: cancelFn });
                })
                .finally(() => {
                    trezorConnect.off('UI_EVENT', onUiEvent);
                    queue.close();
                });
        };

        return {
            id,
            async *run() {
                if (runCalled) throw new Error('Process.run() can only be called once');
                runCalled = true;
                start();

                for await (const sub of queue) {
                    yield sub;
                    if (sub.type === 'complete' || sub.type === 'error') return;
                }
            },
            cancel: cancelFn,
            toPromise: () => {
                start();

                return resultPromise;
            },
        };
    };

    return <M extends (...args: any[]) => Promise<any>>(method: M) =>
        (args: MethodArgs<M>): Process<MethodResult<M>> => {
            const id = nextId();

            return createProcess<MethodResult<M>>(id, callId =>
                method({ ...(args as object), callId }),
            );
        };
};
