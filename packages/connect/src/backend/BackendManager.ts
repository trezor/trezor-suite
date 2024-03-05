import { DataManager } from '../data/DataManager';
import { ERRORS } from '../constants';
import { Blockchain, BlockchainOptions } from './Blockchain';
import { createBlockchainMessage, BLOCKCHAIN } from '../events';

import type { CoinInfo, BlockchainLink } from '../types';

type CoinShortcut = CoinInfo['shortcut'];
type Reconnect = { attempts: number; handle: ReturnType<typeof setTimeout> };

export class BackendManager {
    private readonly instances: { [shortcut: CoinShortcut]: Blockchain } = {};
    private readonly custom: { [shortcut: CoinShortcut]: BlockchainLink } = {};
    private readonly preferred: { [shortcut: CoinShortcut]: string } = {};
    private readonly reconnect: { [shortcut: CoinShortcut]: Reconnect } = {};

    get(shortcut: CoinShortcut): Blockchain | null {
        return this.instances[shortcut] ?? null;
    }

    async getOrConnect(
        coinInfo: CoinInfo,
        postMessage: BlockchainOptions['postMessage'],
    ): Promise<Blockchain> {
        let backend = this.instances[coinInfo.shortcut];
        if (!backend) {
            backend = new Blockchain({
                coinInfo: this.patchCoinInfo(coinInfo),
                postMessage,
                debug: DataManager.getSettings('debug'),
                proxy: DataManager.getSettings('proxy'),
                onDisconnected: pendingSubscriptions => {
                    const reconnectAttempts = pendingSubscriptions ? 0 : undefined;
                    this.onDisconnect(coinInfo, postMessage, reconnectAttempts);
                },
            });
            this.setInstance(coinInfo.shortcut, backend);
        }

        const reconnect = this.clearReconnect(coinInfo.shortcut);

        try {
            const info = await backend.init();
            this.setPreferred(coinInfo.shortcut, info.url);

            return backend;
        } catch (error) {
            this.onDisconnect(coinInfo, postMessage, reconnect?.attempts);
            throw error;
        }
    }

    dispose() {
        Object.keys(this.reconnect).forEach(this.clearReconnect, this);
        Object.values(this.instances).forEach(i => i.disconnect());
    }

    reconnectAll() {
        Object.keys(this.reconnect).forEach(this.clearReconnect, this);
        // collect all running backends as parameters tuple
        const params = Object.values(this.instances).map(i => [i.coinInfo, i.postMessage] as const);
        // remove all backends
        Object.values(this.instances).forEach(i => i.disconnect());

        // initialize again using params tuple
        return Promise.all(params.map(p => this.getOrConnect(...p)));
    }

    isSupported(coinInfo: CoinInfo) {
        const info = this.custom[coinInfo.shortcut] || coinInfo.blockchainLink;
        if (!info) {
            throw ERRORS.TypedError('Backend_NotSupported');
        }
    }

    setCustom(shortcut: CoinShortcut, blockchainLink: BlockchainLink) {
        this.setPreferred(shortcut, undefined);
        this.custom[shortcut] = blockchainLink;
    }

    removeCustom(shortcut: CoinShortcut) {
        this.setPreferred(shortcut, undefined);
        delete this.custom[shortcut];
    }

    private setInstance(shortcut: CoinShortcut, instance: Blockchain | undefined) {
        if (!instance) delete this.instances[shortcut];
        else this.instances[shortcut] = instance;
    }

    // keep backend as a preferred once connection is successfully made
    // switching between urls could lead to side effects (mempool differences, non existing/missing pending transactions)
    private setPreferred(shortcut: CoinShortcut, url: string | undefined) {
        if (!url) delete this.preferred[shortcut];
        else this.preferred[shortcut] = url;
    }

    private onDisconnect(
        coinInfo: CoinInfo,
        postMessage: BlockchainOptions['postMessage'],
        reconnectAttempt: number | undefined,
    ) {
        this.setInstance(coinInfo.shortcut, undefined);

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
            this.getOrConnect(coinInfo, postMessage).catch(() => {});
        }, timeout);
        clearTimeout(this.reconnect[coinInfo.shortcut]?.handle);
        this.reconnect[coinInfo.shortcut] = { attempts: reconnectAttempt + 1, handle };
        postMessage(createBlockchainMessage(BLOCKCHAIN.RECONNECTING, { coin: coinInfo, time }));
    }

    private clearReconnect(shortcut: CoinShortcut) {
        const reconnect = this.reconnect[shortcut];
        clearTimeout(reconnect?.handle);
        delete this.reconnect[shortcut];

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
}
