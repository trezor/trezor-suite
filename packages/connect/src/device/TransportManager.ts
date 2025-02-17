import { TRANSPORT, Transport } from '@trezor/transport';
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

    const getPending = () => promise;

    return { override, getPending };
};

type TransportManagerEvents = {
    [TRANSPORT.START]: Transport;
    [TRANSPORT.ERROR]: string;
};

type TransportManagerParams = {
    startTransport: (
        transport: Transport,
        pendingTransportEvent: boolean,
        signal: AbortSignal,
    ) => Promise<void>;
    stopTransport: (transport: Transport) => Promise<void>;
};

type InitParams = {
    transports: Transport[];
    transportReconnect?: boolean;
    pendingTransportEvent?: boolean;
};

export class TransportManager extends TypedEmitter<TransportManagerEvents> {
    private lock = createOverrideLock();
    private transports: Transport[] = [];
    private activeTransport?: Transport;
    private transportReconnect = false;
    private upgradeTimeout?: ReturnType<typeof setTimeout>;

    private readonly startTransport;
    private readonly stopTransport;

    constructor({ startTransport, stopTransport }: TransportManagerParams) {
        super();
        this.startTransport = startTransport;
        this.stopTransport = stopTransport;
    }

    pending() {
        return this.lock.getPending();
    }

    get() {
        return this.activeTransport;
    }

    init({ transports, transportReconnect = false, pendingTransportEvent = false }: InitParams) {
        this.transports = transports;
        this.transportReconnect = transportReconnect;

        return this.lock.override('New init', signal =>
            this.createInitPromise(pendingTransportEvent, signal),
        );
    }

    dispose() {
        this.removeAllListeners();

        return this.lock.override('Disposing', async () => {
            const { activeTransport } = this;
            if (activeTransport) {
                clearTimeout(this.upgradeTimeout);
                delete this.activeTransport;
                await this.stopTransport(activeTransport);
            }
        });
    }

    private async selectTransport(
        [transport, ...rest]: Transport[],
        signal: AbortSignal,
    ): Promise<Transport> {
        if (signal.aborted) throw new Error(signal.reason);
        if (transport === this.activeTransport) return transport;
        const result = await transport.init({ signal });
        if (result.success) return transport;
        else if (rest.length) return this.selectTransport(rest, signal);
        else throw new Error(result.error);
    }

    private scheduleUpgradeCheck(pendingTransportEvent: boolean) {
        clearTimeout(this.upgradeTimeout);
        this.upgradeTimeout = setTimeout(async () => {
            if (!this.activeTransport || this.activeTransport === this.transports[0]) return;
            for (const t of this.transports) {
                if (t === this.activeTransport) break;
                if (await t.ping()) {
                    this.lock
                        .override('Upgrading', signal =>
                            this.createInitPromise(pendingTransportEvent, signal),
                        )
                        .catch(() => {});

                    return;
                }
            }
            this.scheduleUpgradeCheck(pendingTransportEvent);
        }, 1000);
    }

    private async createInitPromise(pendingTransportEvent: boolean, abortSignal: AbortSignal) {
        try {
            const { transports, activeTransport } = this;
            const transport = transports.length
                ? await this.selectTransport(transports, abortSignal)
                : undefined;

            if (activeTransport !== transport) {
                if (activeTransport) {
                    clearTimeout(this.upgradeTimeout);
                    delete this.activeTransport;
                    await this.stopTransport(activeTransport);
                }

                if (transport) {
                    await this.startTransport(transport, pendingTransportEvent, abortSignal);

                    transport.on(TRANSPORT.ERROR, error => {
                        this.emit(TRANSPORT.ERROR, error);
                        clearTimeout(this.upgradeTimeout);
                        this.lock
                            .override('Transport error', async signal => {
                                delete this.activeTransport;
                                await this.stopTransport(transport);
                                if (this.transportReconnect) {
                                    await resolveAfter(1000, signal);
                                    await this.createInitPromise(pendingTransportEvent, signal);
                                }
                            })
                            .catch(() => {});
                    });

                    this.activeTransport = transport;
                    this.emit(TRANSPORT.START, transport);
                } else {
                    this.emit(TRANSPORT.ERROR, 'Transport disabled');
                }
            }

            if (transport && transport !== transports[0]) {
                // new transport started successfully or present transport kept, and it's not the most preferred one, (re)plan check
                this.scheduleUpgradeCheck(pendingTransportEvent);
            }
        } catch (error) {
            this.emit(TRANSPORT.ERROR, error?.message);
            if (this.transportReconnect && !abortSignal.aborted) {
                this.lock
                    .override('Reconnecting', async signal => {
                        await resolveAfter(1000, signal);
                        await this.createInitPromise(pendingTransportEvent, signal);
                    })
                    .catch(() => {});
            }
        }
    }
}
