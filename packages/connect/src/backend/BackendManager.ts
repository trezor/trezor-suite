import { DataManager } from '../data/DataManager';
import { ERRORS } from '../constants';
import { Blockchain, BlockchainOptions } from './Blockchain';
import { createBlockchainMessage, BLOCKCHAIN } from '../events';
import type { CoinInfo, BlockchainLink } from '../types';

type CoinShortcut = CoinInfo['shortcut'];
type Identity = string;
type CoinShortcutIdentity = `${CoinShortcut}/${Identity}`;
type Reconnect = { attempts: number; handle: ReturnType<typeof setTimeout> };
type BackendParams = Pick<BlockchainOptions, 'coinInfo' | 'postMessage' | 'identity'>;

const DEFAULT_IDENTITY = 'default';

export class BackendManager {
    private readonly instances: { [shortcut: CoinShortcutIdentity]: Blockchain } = {};
    private readonly reconnect: { [shortcut: CoinShortcutIdentity]: Reconnect } = {};
    private readonly custom: { [shortcut: CoinShortcut]: BlockchainLink } = {};
    private readonly preferred: { [shortcut: CoinShortcut]: string } = {};

    get(shortcut: CoinShortcut, identity = DEFAULT_IDENTITY): Blockchain | null {
        return this.instances[`${shortcut}/${identity}`] ?? null;
    }

    async getOrConnect({ coinInfo, postMessage, identity }: BackendParams): Promise<Blockchain> {
        const coinIdentity = `${coinInfo.shortcut}/${identity ?? DEFAULT_IDENTITY}` as const;
        let backend = this.instances[coinIdentity];
        if (!backend) {
            backend = new Blockchain({
                coinInfo: this.patchCoinInfo(coinInfo),
                identity,
                debug: DataManager.getSettings('debug'),
                proxy: DataManager.getSettings('proxy'),
                postMessage,
                onDisconnected: pendingSubscriptions => {
                    const reconnectAttempts = pendingSubscriptions ? 0 : undefined;
                    this.onDisconnect({ coinInfo, postMessage, identity }, reconnectAttempts);
                },
            });
            this.setInstance(coinIdentity, backend);
        }

        const reconnect = this.clearReconnect(coinIdentity);

        try {
            const info = await backend.init();
            this.setPreferred(coinInfo.shortcut, info.url);

            return backend;
        } catch (error) {
            this.onDisconnect({ coinInfo, postMessage, identity }, reconnect?.attempts);
            throw error;
        }
    }

    dispose() {
        Object.keys(this.reconnect)
            .filter(this.getReconnectFilter())
            .forEach(this.clearReconnect, this);
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
        return Promise.all(backends.map(this.getOrConnect, this));
    }

    isSupported(coinInfo: CoinInfo) {
        const info = this.custom[coinInfo.shortcut] || coinInfo.blockchainLink;
        if (!info) {
            throw ERRORS.TypedError('Backend_NotSupported');
        }
    }

    setCustom(shortcut: CoinShortcut, blockchainLink?: BlockchainLink) {
        this.setPreferred(shortcut, undefined);
        if (blockchainLink) {
            this.custom[shortcut] = blockchainLink;
        } else {
            delete this.custom[shortcut];
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
        const coinIdentity = `${coinInfo.shortcut}/${identity ?? DEFAULT_IDENTITY}` as const;
        this.setInstance(coinIdentity, undefined);

        if (reconnectAttempt === undefined || reconnectAttempt === 4) {
            // Forget preferred backend when no reconnection is wanted
            // or when it couldn't be connected repeatedly.
            // Fourth attempt was chosen arbitrarily.
            this.setPreferred(coinInfo.shortcut, undefined);
        }

        if (reconnectAttempt === undefined) {
            return;
        }

        const timeout = Math.min(2500 * reconnectAttempt, 20000);
        const time = Date.now() + timeout;
        const handle = setTimeout(() => {
            this.getOrConnect({ coinInfo, postMessage, identity }).catch(() => {});
        }, timeout);
        clearTimeout(this.reconnect[coinIdentity]?.handle);
        this.reconnect[coinIdentity] = { attempts: reconnectAttempt + 1, handle };
        postMessage(
            createBlockchainMessage(BLOCKCHAIN.RECONNECTING, { coin: coinInfo, identity, time }),
        );
    }

    private clearReconnect(coinIdentity: CoinShortcutIdentity) {
        const reconnect = this.reconnect[coinIdentity];
        clearTimeout(reconnect?.handle);
        delete this.reconnect[coinIdentity];

        return reconnect;
    }

    private patchCoinInfo(coinInfo: CoinInfo): CoinInfo {
        const custom = this.custom[coinInfo.shortcut];
        const preferred = this.preferred[coinInfo.shortcut];
        const url = preferred ? [preferred] : custom?.url ?? coinInfo.blockchainLink?.url;

        return {
            ...coinInfo,
            blockchainLink: {
                ...coinInfo.blockchainLink,
                ...custom,
                url,
            },
        };
    }

    private getReconnectFilter(coinInfo?: CoinInfo) {
        return (key: string): key is CoinShortcutIdentity =>
            !coinInfo || key.startsWith(`${coinInfo.shortcut}/`);
    }
}
