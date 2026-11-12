import { BLOCKCHAIN, createBlockchainMessage } from '@trezor/connect-common';
import type { BlockchainLink, CoinInfo, Proxy } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import type { TimerId } from '@trezor/type-utils';
import { deepEqual } from '@trezor/utils';

import type { BlockchainOptions } from './Blockchain';
import { Blockchain } from './Blockchain';
import * as settingsStore from '../data/settingsStore';

type CoinShortcut = CoinInfo['shortcut'];
type Identity = string;
type CoinShortcutIdentity = `${CoinShortcut}/${Identity}`;
type BackendParams = Pick<BlockchainOptions, 'coinInfo' | 'postMessage' | 'identity'>;

// One connection per coin and identity. A backend is `connecting` until its init settles and
// `connected` afterwards; a dropped backend waits for its next attempt in `reconnecting`.
// `attempts` drives the reconnect backoff and carries over to the next connection, so a backend
// that drops again soon continues the previous backoff. Events of a backend only apply while it
// is the current one, so a replaced or disposed backend cannot remove its successor.
type BackendConnection =
    | {
          status: 'connecting';
          backend: Blockchain;
          promise: Promise<Blockchain>;
          attempts: number;
      }
    | { status: 'connected'; backend: Blockchain; attempts: number; connectedAt: number }
    | { status: 'reconnecting'; handle: TimerId; attempts: number };

const DEFAULT_IDENTITY = 'default';

const RECONNECT_STEP = 2500;
const RECONNECT_MIN_TIMEOUT = 1000;
const RECONNECT_MAX_TIMEOUT = 20000;
// A backend that drops again sooner than this never really recovered, so the next attempt
// continues the previous backoff instead of restarting it and hammering the backend.
const STABLE_CONNECTION_TIME = 30000;

export class BackendManager {
    private proxy?: Proxy;

    private connections: { [shortcut: CoinShortcutIdentity]: BackendConnection } = {};
    private readonly custom: { [shortcut: CoinShortcut]: BlockchainLink } = {};
    private readonly preferred: { [shortcut: CoinShortcut]: string } = {};

    get(shortcut: CoinShortcut, identity = DEFAULT_IDENTITY): Blockchain | null {
        return this.getBackend(`${shortcut}/${identity}`) ?? null;
    }

    getOrConnect(params: BackendParams, { force }: { force?: boolean } = {}) {
        const coinIdentity = this.getCoinIdentity(params);

        // A dropped backend is retried on a growing delay. Connecting on demand instead would
        // skip that delay entirely, because a coin with accounts is asked for the backend on
        // every account sync — which is what turned one dropped Solana socket into 15 connect
        // attempts and 111 requests per second. Only an explicit reconnect may skip the wait.
        if (!force && this.connections[coinIdentity]?.status === 'reconnecting') {
            return Promise.reject(ERRORS.TypedError('Backend_Disconnected'));
        }

        return this.connect(params);
    }

    private connect(params: BackendParams): Promise<Blockchain> {
        const { coinInfo, postMessage, identity } = params;
        const coinIdentity = this.getCoinIdentity(params);
        const current = this.connections[coinIdentity];

        if (current?.status === 'connected') {
            return Promise.resolve(current.backend);
        }

        if (current?.status === 'connecting') {
            return current.promise;
        }

        // only keep retrying if a reconnection was already in flight
        const isReconnecting = current?.status === 'reconnecting';
        if (isReconnecting) {
            clearTimeout(current.handle);
        }
        const attempts = current?.attempts ?? 0;

        const backend: Blockchain = new Blockchain({
            coinInfo: this.patchCoinInfo(coinInfo),
            identity,
            debug: settingsStore.get('debug'),
            proxy: this.proxy,
            postMessage,
            onDisconnected: pendingSubscriptions => {
                const connection = this.connections[coinIdentity];
                if (connection?.status === 'reconnecting' || connection?.backend !== backend) {
                    return;
                }

                const wasStable =
                    connection.status === 'connected' &&
                    Date.now() - connection.connectedAt >= STABLE_CONNECTION_TIME;
                const nextAttempt = wasStable ? 0 : connection.attempts;
                this.onDisconnect(params, pendingSubscriptions ? nextAttempt : undefined);
            },
        });

        const promise = backend.init().then(
            info => {
                if (this.getBackend(coinIdentity) === backend) {
                    this.setPreferred(coinInfo.shortcut, info.url);
                    this.connections[coinIdentity] = {
                        status: 'connected',
                        backend,
                        attempts,
                        connectedAt: Date.now(),
                    };
                }

                return backend;
            },
            error => {
                if (this.getBackend(coinIdentity) === backend) {
                    this.onDisconnect(params, isReconnecting ? attempts : undefined);
                }
                throw error;
            },
        );

        this.connections[coinIdentity] = { status: 'connecting', backend, promise, attempts };

        return promise;
    }

    dispose() {
        const backends = Object.values(this.connections).flatMap(connection => {
            if (connection.status === 'reconnecting') {
                clearTimeout(connection.handle);

                return [];
            }

            return [connection.backend];
        });
        this.connections = {};
        backends.forEach(backend => {
            backend.disconnect();
            this.setPreferred(backend.coinInfo.shortcut, undefined);
        });
    }

    reconnectAll(coin?: CoinInfo) {
        // collect all running backends
        const backends = Object.values(this.connections)
            .flatMap(connection =>
                connection.status === 'reconnecting' ? [] : [connection.backend],
            )
            .filter(backend => !coin || coin.shortcut === backend.coinInfo.shortcut);
        // disconnect and remove them
        backends.forEach(i => i.disconnect());

        // initialize again using old backends as params
        return Promise.all(backends.map(backend => this.getOrConnect(backend, { force: true })));
    }

    isSupported(coinInfo: CoinInfo) {
        const info = this.custom[coinInfo.shortcut] || coinInfo.blockchainLink;

        return !!info;
    }

    setCustom(shortcut: CoinShortcut, blockchainLink?: BlockchainLink) {
        this.setPreferred(shortcut, undefined);
        if (blockchainLink) {
            this.custom[shortcut] = blockchainLink;
        } else {
            delete this.custom[shortcut];
        }
    }

    async updateProxy(proxy: Proxy | undefined) {
        if (proxy !== undefined && !deepEqual(this.proxy, proxy)) {
            this.proxy = proxy;
            await this.reconnectAll();
        }
    }

    private getBackend(coinIdentity: CoinShortcutIdentity) {
        const connection = this.connections[coinIdentity];

        return connection?.status === 'reconnecting' ? undefined : connection?.backend;
    }

    // keep backend as a preferred once connection is successfully made
    // switching between urls could lead to side effects (mempool differences, non existing/missing pending transactions)
    private setPreferred(shortcut: CoinShortcut, url: string | undefined) {
        if (!url) delete this.preferred[shortcut];
        else this.preferred[shortcut] = url;
    }

    private onDisconnect(
        { coinInfo, postMessage, identity }: BackendParams,
        reconnectAttempt: number | undefined,
    ) {
        const coinIdentity = this.getCoinIdentity({ coinInfo, identity });

        if (reconnectAttempt === undefined || reconnectAttempt === 4) {
            // Forget preferred backend when no reconnection is wanted
            // or when it couldn't be connected repeatedly.
            // Fourth attempt was chosen arbitrarily.
            this.setPreferred(coinInfo.shortcut, undefined);
        }

        if (reconnectAttempt === undefined) {
            delete this.connections[coinIdentity];

            return;
        }

        const timeout = Math.min(
            Math.max(RECONNECT_STEP * reconnectAttempt, RECONNECT_MIN_TIMEOUT),
            RECONNECT_MAX_TIMEOUT,
        );
        const time = Date.now() + timeout;
        const handle = setTimeout(() => {
            this.connect({ coinInfo, postMessage, identity }).catch(() => {});
        }, timeout);
        this.connections[coinIdentity] = {
            status: 'reconnecting',
            handle,
            attempts: reconnectAttempt + 1,
        };
        postMessage(
            createBlockchainMessage(BLOCKCHAIN.RECONNECTING, { coin: coinInfo, identity, time }),
        );
    }

    private getCoinIdentity({
        coinInfo,
        identity,
    }: Pick<BackendParams, 'coinInfo' | 'identity'>): CoinShortcutIdentity {
        return `${coinInfo.shortcut}/${identity ?? DEFAULT_IDENTITY}`;
    }

    private patchCoinInfo(coinInfo: CoinInfo): CoinInfo {
        const thisCustom = this.custom;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const custom: BlockchainLink = thisCustom[coinInfo.shortcut];
        const thisPreferred = this.preferred;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const preferred: string = thisPreferred[coinInfo.shortcut];

        const url = preferred ? [preferred] : (custom?.url ?? coinInfo.blockchainLink?.url ?? []);

        const patchedBlockchainLink: CoinInfo['blockchainLink'] = {
            ...coinInfo.blockchainLink,
            ...custom,
            url,
        };

        return {
            ...coinInfo,
            blockchainLink: patchedBlockchainLink,
        };
    }
}
