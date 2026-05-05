import { EventChannel } from './eventChannel';
import type {
    ConnectResult,
    TrezorConnectLike,
    UiEvent,
    UiEventListener,
} from './trezorConnectLike';
import { SUBPROCESS_TYPE } from './types';
import type {
    AnySubProcess,
    ConnectService,
    CreateWalletOptions,
    Process,
    WalletResult,
    WalletSubProcess,
} from './types';

let counter = 0;
const nextCallId = () => `call-${Date.now()}-${++counter}`;

interface SubProcessContext {
    callId: string;
    cancel: () => void;
}

const mapEventToSubProcess = <TResult>(
    event: UiEvent,
    trezorConnect: TrezorConnectLike,
    ctx: SubProcessContext,
): AnySubProcess<TResult> => {
    const base = { callId: ctx.callId, cancel: ctx.cancel };
    switch (event.type) {
        case 'ui-request_passphrase':
            return {
                ...base,
                type: SUBPROCESS_TYPE.REQUEST_PASSPHRASE,
                send: (passphrase, options) => {
                    trezorConnect.uiResponse({
                        type: 'ui-receive_passphrase',
                        payload: {
                            value: passphrase,
                            save: options?.save ?? false,
                            passphraseOnDevice: false,
                        },
                        requestId: event.requestId,
                    });
                },
            };
        case 'ui-request_passphrase_on_device':
            return { ...base, type: SUBPROCESS_TYPE.REQUEST_PASSPHRASE_ON_DEVICE };
        case 'ui-request_pin':
            return {
                ...base,
                type: SUBPROCESS_TYPE.REQUEST_PIN,
                send: pin => {
                    trezorConnect.uiResponse({
                        type: 'ui-receive_pin',
                        payload: { value: pin },
                        requestId: event.requestId,
                    });
                },
            };
        case 'ui-request_button':
            return { ...base, type: SUBPROCESS_TYPE.REQUEST_BUTTON, code: event.payload.code };
    }
};

interface FlowContext<TResult> {
    devicePath: string;
    invoke: () => Promise<ConnectResult<TResult>>;
}

const buildProcess = <TResult>(
    trezorConnect: TrezorConnectLike,
    activeRef: { current: Process<AnySubProcess<unknown>> | null },
    context: FlowContext<TResult>,
): Process<AnySubProcess<TResult>> => {
    const callId = nextCallId();
    let runCalled = false;
    let started = false;
    let cancelled = false;

    const channel = new EventChannel<AnySubProcess<TResult>>();
    let listener: UiEventListener | null = null;
    const selfRef: { proc: Process<AnySubProcess<TResult>> | null } = { proc: null };

    let resolveResult: (value: TResult) => void = () => {};
    let rejectResult: (error: Error) => void = () => {};
    const resultPromise = new Promise<TResult>((resolve, reject) => {
        resolveResult = resolve;
        rejectResult = reject;
    });
    // Suppress "unhandled rejection" if no one calls toPromise() — the rejection
    // is still observable to anyone who awaits resultPromise later.
    resultPromise.catch(() => {});

    const cleanup = () => {
        if (listener) {
            trezorConnect.off('UI_EVENT', listener);
            listener = null;
        }
        channel.close();
        if (
            selfRef.proc &&
            activeRef.current === (selfRef.proc as Process<AnySubProcess<unknown>>)
        ) {
            activeRef.current = null;
        }
    };

    const cancelFn = () => {
        cancelled = true;
        rejectResult(new Error('Process cancelled'));
        cleanup();
    };

    const subCtx: SubProcessContext = { callId, cancel: cancelFn };

    const start = () => {
        if (started) return;
        started = true;

        listener = (event: UiEvent) => {
            if (event.payload?.device?.path !== context.devicePath) return;
            channel.push(mapEventToSubProcess<TResult>(event, trezorConnect, subCtx));
        };
        trezorConnect.on('UI_EVENT', listener);

        context
            .invoke()
            .then(result => {
                if (result.success) {
                    resolveResult(result.payload);
                    channel.push({
                        ...subCtx,
                        type: SUBPROCESS_TYPE.COMPLETE,
                        result: result.payload,
                    });
                } else {
                    const error = new Error(result.payload.error);
                    rejectResult(error);
                    channel.push({ ...subCtx, type: SUBPROCESS_TYPE.ERROR, error });
                }
            })
            .catch(error => {
                const err = error instanceof Error ? error : new Error(String(error));
                rejectResult(err);
                channel.push({ ...subCtx, type: SUBPROCESS_TYPE.ERROR, error: err });
            })
            .finally(() => {
                channel.close();
            });
    };

    async function* runIterator(): AsyncIterableIterator<AnySubProcess<TResult>> {
        start();
        try {
            while (true) {
                if (cancelled) return;
                const next = await channel.pull();
                if (next.done) return;
                yield next.value;
                if (
                    next.value.type === SUBPROCESS_TYPE.COMPLETE ||
                    next.value.type === SUBPROCESS_TYPE.ERROR
                )
                    return;
            }
        } finally {
            cleanup();
        }
    }

    const proc: Process<AnySubProcess<TResult>> = {
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
    const activeRef: { current: Process<AnySubProcess<unknown>> | null } = { current: null };

    const guard = <TResult>(
        create: () => Process<AnySubProcess<TResult>>,
    ): Process<AnySubProcess<TResult>> => {
        if (activeRef.current) {
            throw new Error(
                'connectService is already running a process; await or cancel it before starting another',
            );
        }
        const proc = create();
        activeRef.current = proc as Process<AnySubProcess<unknown>>;

        return proc;
    };

    return {
        createWallet: (options: CreateWalletOptions): Process<WalletSubProcess> =>
            guard<WalletResult>(() =>
                buildProcess<WalletResult>(trezorConnect, activeRef, {
                    devicePath: options.devicePath,
                    invoke: async () => {
                        const result = await trezorConnect.getDeviceState({
                            device: { path: options.devicePath },
                            useEmptyPassphrase: !options.usePassphrase,
                        });
                        if (!result.success) return result;

                        return {
                            success: true,
                            payload: { deviceState: result.payload.state },
                        };
                    },
                }),
            ),
    };
};
