import { type Descriptor, TRANSPORT, type Transport } from '@trezor/transport-common';
import { TypedEmitter, resolveAfter } from '@trezor/utils';

const createOverrideLock = () => {
    let promise: Promise<void> | undefined;
    let sequence = 0;
    let abort: AbortController | undefined;
    let message: string | undefined;

    const override = async <T extends void>(
        abortMessage: string,
        action: (signal: AbortSignal) => Promise<T>,
    ) => {
        message = abortMessage;
        const seq = ++sequence;

        while (promise) {
            abort?.abort(new Error(abortMessage));
            await promise.catch(() => {});
        }

        if (seq !== sequence) return Promise.reject(new Error(message));

        abort = new AbortController();
        promise = action(abort.signal).finally(() => {
            abort = undefined;
            promise = undefined;
        });

        return promise as Promise<T>;
    };

    return { override };
};

type TransportManagerEvents = {
    [TRANSPORT.START]: (transport: Transport, descriptors: Descriptor[]) => void;
    [TRANSPORT.ERROR]: string;
};

type InitParams = {
    transports: Transport[];
};

const RECONNECT_INITIAL_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 30_000;

export class TransportManager extends TypedEmitter<TransportManagerEvents> {
    private lock = createOverrideLock();
    private transports: Transport[] = [];
    private activeTransport?: Transport;
    private upgradeTimeout?: ReturnType<typeof setTimeout>;
    private reconnectAttempt = 0;
    private lastEmittedError?: string;

    get() {
        return this.activeTransport;
    }

    init({ transports }: InitParams) {
        this.transports = transports;
        this.resetReconnectState();

        return this.lock.override('New init', signal => this.createInitPromise(signal));
    }

    dispose() {
        this.removeAllListeners();

        return this.lock.override('Disposing', () => {
            const { activeTransport } = this;
            if (activeTransport) {
                clearTimeout(this.upgradeTimeout);
                delete this.activeTransport;
                activeTransport.stop();
            }

            return Promise.resolve();
        });
    }

    private resetReconnectState() {
        this.reconnectAttempt = 0;
        delete this.lastEmittedError;
    }

    // A transport which cannot initialize at all would otherwise be retried once per second
    // forever, which is a measurable cost on mobile, so the delay grows up to a ceiling.
    private getReconnectDelay() {
        const delay = Math.min(
            RECONNECT_INITIAL_DELAY_MS * 2 ** this.reconnectAttempt,
            RECONNECT_MAX_DELAY_MS,
        );
        this.reconnectAttempt += 1;

        return delay;
    }

    // Every reconnect attempt fails for the same reason until something changes, hosts don't need
    // to be told repeatedly.
    private emitError(error: string) {
        if (error === this.lastEmittedError) return;

        this.lastEmittedError = error;
        this.emit(TRANSPORT.ERROR, error);
    }

    private async selectTransport(
        transports: Transport[],
        signal: AbortSignal,
    ): Promise<Transport> {
        if (signal.aborted) throw new Error(signal.reason);
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const transport: Transport = transports[0];
        const rest = transports.slice(1);
        if (transport === this.activeTransport) return transport;
        const result = await transport.init({ signal });
        if (result.success) return transport;
        else if (rest.length) return this.selectTransport(rest, signal);
        else throw new Error(result.error.code);
    }

    private scheduleUpgradeCheck() {
        clearTimeout(this.upgradeTimeout);
        this.upgradeTimeout = setTimeout(async () => {
            if (!this.activeTransport || this.activeTransport === this.transports[0]) return;
            for (const t of this.transports) {
                if (t === this.activeTransport) break;
                if (await t.ping()) {
                    this.lock
                        .override('Upgrading', signal => this.createInitPromise(signal))
                        .catch(() => {});

                    return;
                }
            }
            this.scheduleUpgradeCheck();
        }, 1000);
    }

    private async createInitPromise(abortSignal: AbortSignal) {
        try {
            const { transports, activeTransport } = this;
            const transport = transports.length
                ? await this.selectTransport(transports, abortSignal)
                : undefined;

            if (activeTransport !== transport) {
                if (activeTransport) {
                    clearTimeout(this.upgradeTimeout);
                    delete this.activeTransport;
                    activeTransport.stop();
                }

                if (transport) {
                    let descriptors;

                    try {
                        // enumerating for the first time. we intentionally postpone emitting TRANSPORT_START
                        // event until we read descriptors for the first time
                        const result = await transport.enumerate({ signal: abortSignal });

                        if (!result.success) {
                            throw new Error(result.error.message || result.error.code);
                        }

                        descriptors = result.payload;
                    } catch (err) {
                        transport.stop();
                        throw err;
                    }

                    transport.on(TRANSPORT.ERROR, error => {
                        this.emitError(error);
                        clearTimeout(this.upgradeTimeout);
                        this.lock
                            .override('Transport error', async signal => {
                                delete this.activeTransport;
                                transport.stop();
                                await resolveAfter(this.getReconnectDelay(), signal);
                                await this.createInitPromise(signal);
                            })
                            .catch(() => {});
                    });

                    this.activeTransport = transport;
                    this.resetReconnectState();
                    this.emit(TRANSPORT.START, transport, descriptors);
                } else {
                    this.emit(TRANSPORT.ERROR, 'Transport disabled');
                }
            }

            if (transport && transport !== transports[0]) {
                // new transport started successfully or present transport kept, and it's not the most preferred one, (re)plan check
                this.scheduleUpgradeCheck();
            }
        } catch (error) {
            this.emitError(error?.message);
            if (!abortSignal.aborted) {
                this.lock
                    .override('Reconnecting', async signal => {
                        await resolveAfter(this.getReconnectDelay(), signal);
                        await this.createInitPromise(signal);
                    })
                    .catch(() => {});
            }
        }
    }
}
