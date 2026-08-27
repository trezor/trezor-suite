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
type Reconnect = { handle: TimerId };
type BackendParams = Pick<BlockchainOptions, 'coinInfo' | 'postMessage' | 'identity'>;

const DEFAULT_IDENTITY = 'default';

const RECONNECT_STEP = 2500;
const RECONNECT_MIN_TIMEOUT = 1000;
const RECONNECT_MAX_TIMEOUT = 20000;
// A backend that drops again sooner than this never really recovered, so the next attempt
// continues the previous backoff instead of restarting it and hammering the backend.
const STABLE_CONNECTION_TIME = 30000;

export class BackendManager {
    private proxy?: Proxy;

    private readonly instances: { [shortcut: CoinShortcutIdentity]: Blockchain } = {};
    private readonly reconnect: { [shortcut: CoinShortcutIdentity]: Reconnect } = {};
    private readonly connectedAt: { [shortcut: CoinShortcutIdentity]: number } = {};
    private readonly attempts: { [shortcut: CoinShortcutIdentity]: number } = {};
    private readonly custom: { [shortcut: CoinShortcut]: BlockchainLink } = {};
    private readonly preferred: { [shortcut: CoinShortcut]: string } = {};

    get(shortcut: CoinShortcut, identity = DEFAULT_IDENTITY): Blockchain | null {
        return this.instances[`${shortcut}/${identity}`] ?? null;
    }

    getOrConnect(params: BackendParams, { force }: { force?: boolean } = {}) {
        const coinIdentity = this.getCoinIdentity(params);

        // A dropped backend is retried on a growing delay. Connecting on demand instead would
        // skip that delay entirely, because a coin with accounts is asked for the backend on
        // every account sync — which is what turned one dropped Solana socket into 15 connect
        // attempts and 111 requests per second. Only an explicit reconnect may skip the wait.
        if (!force && this.reconnect[coinIdentity] && !this.instances[coinIdentity]) {
            return Promise.reject(ERRORS.TypedError('Backend_Disconnected'));
        }

        return this.connect(params);
    }

    private async connect({ coinInfo, postMessage, identity }: BackendParams): Promise<Blockchain> {
        const coinIdentity = this.getCoinIdentity({ coinInfo, identity });
        let backend = this.instances[coinIdentity];
        if (!backend) {
            backend = new Blockchain({
                coinInfo: this.patchCoinInfo(coinInfo),
                identity,
                debug: settingsStore.get('debug'),
                proxy: this.proxy,
                postMessage,
                onDisconnected: pendingSubscriptions => {
                    const reconnectAttempts = pendingSubscriptions
                        ? this.nextAttempt(coinIdentity)
                        : undefined;
                    this.onDisconnect({ coinInfo, postMessage, identity }, reconnectAttempts);
                },
            });
            this.setInstance(coinIdentity, backend);
        }

        const reconnect = this.clearReconnect(coinIdentity);

        try {
            const info = await backend.init();
            this.setPreferred(coinInfo.shortcut, info.url);
            this.connectedAt[coinIdentity] = Date.now();

            return backend;
        } catch (error) {
            // only keep retrying if a reconnection was already in flight
            const attempts = reconnect ? (this.attempts[coinIdentity] ?? 0) : undefined;
            this.onDisconnect({ coinInfo, postMessage, identity }, attempts);
            throw error;
        }
    }

    dispose() {
        Object.keys(this.reconnect)
            .filter(this.getReconnectFilter())
            .forEach(this.clearReconnect, this);
        Object.keys(this.attempts).forEach(
            key => delete this.attempts[key as CoinShortcutIdentity],
        );
        Object.keys(this.connectedAt).forEach(
            key => delete this.connectedAt[key as CoinShortcutIdentity],
        );
        Object.values(this.instances).forEach(i => i.disconnect());
    }

    reconnectAll(coin?: CoinInfo) {
        // collect all running backends
        const backends = Object.values(this.instances).filter(
            backend => !coin || coin.shortcut === backend.coinInfo.shortcut,
        );
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

    private setInstance(coinIdentity: CoinShortcutIdentity, instance: Blockchain | undefined) {
        if (!instance) delete this.instances[coinIdentity];
        else this.instances[coinIdentity] = instance;
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
        this.setInstance(coinIdentity, undefined);
        delete this.connectedAt[coinIdentity];

        if (reconnectAttempt === undefined || reconnectAttempt === 4) {
            // Forget preferred backend when no reconnection is wanted
            // or when it couldn't be connected repeatedly.
            // Fourth attempt was chosen arbitrarily.
            this.setPreferred(coinInfo.shortcut, undefined);
        }

        if (reconnectAttempt === undefined) {
            delete this.attempts[coinIdentity];

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
        clearTimeout(this.reconnect[coinIdentity]?.handle);
        this.reconnect[coinIdentity] = { handle };
        this.attempts[coinIdentity] = reconnectAttempt + 1;
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

    private nextAttempt(coinIdentity: CoinShortcutIdentity) {
        const connectedAt = this.connectedAt[coinIdentity];
        const wasStable =
            connectedAt !== undefined && Date.now() - connectedAt >= STABLE_CONNECTION_TIME;

        return wasStable ? 0 : (this.attempts[coinIdentity] ?? 0);
    }

    private clearReconnect(coinIdentity: CoinShortcutIdentity) {
        const reconnect = this.reconnect[coinIdentity];
        clearTimeout(reconnect?.handle);
        delete this.reconnect[coinIdentity];

        return reconnect;
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

    private getReconnectFilter(coinInfo?: CoinInfo) {
        return (key: string): key is CoinShortcutIdentity =>
            !coinInfo || key.startsWith(`${coinInfo.shortcut}/`);
    }
}
