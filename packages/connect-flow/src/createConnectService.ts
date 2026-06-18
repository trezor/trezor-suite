import { EventChannel } from './eventChannel';
import {
    type ConnectResult,
    type PopupEventMessage,
    type TrezorConnectLike,
    UI_REQUEST,
    UI_RESPONSE,
    type UiEvent,
    type UiEventListener,
    type UiEventMessage,
} from './trezorConnectLike';
import { SUBPROCESS_TYPE } from './types';
import type {
    AddressResult,
    AnySubProcess,
    ConnectService,
    CreateWalletOptions,
    GetAddressOptions,
    Process,
    WalletResult,
} from './types';

// TrezorConnect requires callId to be a valid UUID.
const nextCallId = () => crypto.randomUUID();

interface SubProcessContext {
    callId: string;
    cancel: () => void;
}

// Distinguish UI events from popup messages on the shared `UI_EVENT` channel.
// Built from `UI_REQUEST` so any newly added UI event variant is automatically
// recognised without touching this filter.
const UI_REQUEST_VALUES: ReadonlySet<string> = new Set(Object.values(UI_REQUEST));

const isUiEvent = (event: UiEventMessage | PopupEventMessage): event is UiEvent =>
    UI_REQUEST_VALUES.has(event.type);

const mapEventToSubProcess = (
    event: UiEvent,
    trezorConnect: TrezorConnectLike,
    ctx: SubProcessContext,
): AnySubProcess => {
    const base = { callId: ctx.callId, requestId: event.requestId, cancel: ctx.cancel };
    switch (event.type) {
        case UI_REQUEST.REQUEST_PASSPHRASE:
            return {
                ...base,
                type: SUBPROCESS_TYPE.REQUEST_PASSPHRASE,
                send: (passphrase, options) => {
                    trezorConnect.uiResponse({
                        type: UI_RESPONSE.RECEIVE_PASSPHRASE,
                        payload: {
                            value: passphrase,
                            save: options?.save ?? false,
                            passphraseOnDevice: false,
                        },
                        requestId: event.requestId,
                    });
                },
            };
        case UI_REQUEST.REQUEST_PIN:
            return {
                ...base,
                type: SUBPROCESS_TYPE.REQUEST_PIN,
                send: pin => {
                    trezorConnect.uiResponse({
                        type: UI_RESPONSE.RECEIVE_PIN,
                        payload: pin,
                        requestId: event.requestId,
                    });
                },
            };
        case UI_REQUEST.REQUEST_CONFIRMATION:
            return {
                ...base,
                type: SUBPROCESS_TYPE.REQUEST_CONFIRMATION,
                view: event.payload.view,
                label: event.payload.label,
                confirm: value => {
                    trezorConnect.uiResponse({
                        type: UI_RESPONSE.RECEIVE_CONFIRMATION,
                        payload: value,
                        requestId: event.requestId,
                    });
                },
            };
        default:
            // Non-interactive UI event — pass through with the original event
            // payload so consumers can discriminate by `type` and read the
            // full data (e.g. `payload.code` for button requests).
            return { ...base, ...event } as AnySubProcess;
    }
};

interface FlowContext<TResult> {
    invoke: (callId: string) => Promise<ConnectResult<TResult>>;
}

const buildProcess = <TResult>(
    trezorConnect: TrezorConnectLike,
    activeRef: { current: Process<unknown> | null },
    context: FlowContext<TResult>,
): Process<TResult> => {
    const callId = nextCallId();
    let runCalled = false;
    let started = false;
    let cancelled = false;

    const channel = new EventChannel<AnySubProcess>();
    let listener: UiEventListener | null = null;
    const selfRef: { proc: Process<TResult> | null } = { proc: null };

    let resolveResult: (value: TResult) => void = () => {};
    let rejectResult: (error: Error) => void = () => {};
    const resultPromise = new Promise<TResult>((resolve, reject) => {
        resolveResult = resolve;
        rejectResult = reject;
    });
    resultPromise.catch(() => {});

    const cleanup = () => {
        if (listener) {
            trezorConnect.off('UI_EVENT', listener);
            listener = null;
        }
        channel.close();
        if (selfRef.proc && activeRef.current === (selfRef.proc as Process<unknown>)) {
            activeRef.current = null;
        }
    };

    const cancelFn = () => {
        if (cancelled) return;
        cancelled = true;
        // Tell TrezorConnect to abort the in-flight call so the device stops
        // waiting on the user and the next call isn't queued behind it.
        trezorConnect.cancel('Process cancelled');
        rejectResult(new Error('Process cancelled'));
        cleanup();
    };

    const subCtx: SubProcessContext = { callId, cancel: cancelFn };

    const start = () => {
        if (started) return;
        started = true;

        listener = event => {
            // Drop popup messages — TrezorConnect emits both UI events and
            // popup messages on the same `UI_EVENT` channel.
            if (!isUiEvent(event)) return;
            // Filter by callId — TrezorConnect echoes our callId on every UI event
            // it emits during this method call.
            if (event.callId !== callId) return;
            const sub = mapEventToSubProcess(event, trezorConnect, subCtx);
            channel.push(sub);
        };
        trezorConnect.on('UI_EVENT', listener);

        context
            .invoke(callId)
            .then(result => {
                if (result.success) {
                    resolveResult(result.payload);
                } else {
                    rejectResult(new Error(result.payload.error));
                }
            })
            .catch(error => {
                rejectResult(error instanceof Error ? error : new Error(String(error)));
            })
            .finally(() => {
                channel.close();
            });
    };

    async function* runIterator(): AsyncIterableIterator<AnySubProcess> {
        start();
        try {
            while (true) {
                if (cancelled) return;
                const next = await channel.pull();
                if (next.done) break;
                yield next.value;
            }
            // The channel closes when the call settles. Surface a failure by
            // rethrowing here so a bare `for await (...)` throws; a cancel is a
            // clean stop, not an error.
            if (!cancelled) await resultPromise;
        } finally {
            cleanup();
        }
    }

    const proc: Process<TResult> = {
        callId,
        run: () => {
            if (runCalled) {
                throw new Error('Process.run() can only be called once');
            }
            runCalled = true;

            return runIterator();
        },
        cancel: cancelFn,
        toPromise: () => {
            start();

            return resultPromise;
        },
    };
    selfRef.proc = proc;

    return proc;
};

export const createConnectService = (deps: {
    trezorConnect: TrezorConnectLike;
}): ConnectService => {
    const { trezorConnect } = deps;
    const activeRef: { current: Process<unknown> | null } = { current: null };

    const guard = <TResult>(create: () => Process<TResult>): Process<TResult> => {
        if (activeRef.current) {
            throw new Error(
                'connectService is already running a process; await or cancel it before starting another',
            );
        }
        const proc = create();
        activeRef.current = proc as Process<unknown>;

        return proc;
    };

    return {
        createWallet: (options: CreateWalletOptions): Process<WalletResult> =>
            guard<WalletResult>(() =>
                buildProcess<WalletResult>(trezorConnect, activeRef, {
                    invoke: async callId => {
                        const result = await trezorConnect.getDeviceState({
                            device: { path: options.devicePath },
                            useEmptyPassphrase: !options.usePassphrase,
                            callId,
                        });
                        if (!result.success) return result;

                        return {
                            success: true,
                            payload: { deviceState: result.payload.state },
                        };
                    },
                }),
            ),

        getAddress: (options: GetAddressOptions): Process<AddressResult> =>
            guard<AddressResult>(() =>
                buildProcess<AddressResult>(trezorConnect, activeRef, {
                    invoke: callId =>
                        trezorConnect.getAddress({
                            ...(options.devicePath ? { device: { path: options.devicePath } } : {}),
                            path: options.path,
                            coin: options.coin,
                            showOnTrezor: options.showOnTrezor,
                            callId,
                        }),
                }),
            ),
    };
};
