import { DataManager } from '../data/DataManager';
import { ERRORS } from '../constants';
import { Blockchain, BlockchainOptions } from './Blockchain';

import type { CoinInfo, BlockchainLink } from '../types';

type CoinShortcut = CoinInfo['shortcut'];

export class BackendManager {
    private readonly instances: { [shortcut: CoinShortcut]: Blockchain } = {};
    private readonly custom: { [shortcut: CoinShortcut]: BlockchainLink } = {};
    private readonly preferred: { [shortcut: CoinShortcut]: string } = {};

    get(shortcut: CoinShortcut): Blockchain | null {
        return this.instances[shortcut] ?? null;
    }

    remove(shortcut: CoinShortcut) {
        delete this.instances[shortcut];
    }

    async getOrConnect(
        coinInfo: CoinInfo,
        postMessage: BlockchainOptions['postMessage'],
    ): Promise<Blockchain> {
        let backend = this.get(coinInfo.shortcut);
        if (!backend) {
            backend = new Blockchain({
                coinInfo: this.patchCoinInfo(coinInfo),
                postMessage,
                debug: DataManager.getSettings('debug'),
                proxy: DataManager.getSettings('proxy'),
                onConnected: url => this.setPreferred(coinInfo.shortcut, url),
                onDisconnected: () => this.remove(coinInfo.shortcut),
            });
            this.instances[coinInfo.shortcut] = backend;

            try {
                await backend.init();
            } catch (error) {
                this.remove(coinInfo.shortcut);
                this.removePreferred(coinInfo.shortcut);
                throw error;
            }
        }
        return backend;
    }

    dispose() {
        Object.values(this.instances).forEach(i => i.disconnect());
    }

    reconnectAll() {
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
        this.removePreferred(shortcut);
        this.custom[shortcut] = blockchainLink;
    }

    removeCustom(shortcut: CoinShortcut) {
        this.removePreferred(shortcut);
        delete this.custom[shortcut];
    }

    // keep backend as a preferred once connection is successfully made
    // switching between urls could lead to side effects (mempool differences, non existing/missing pending transactions)
    private setPreferred(shortcut: CoinShortcut, url: string) {
        this.preferred[shortcut] = url;
    }

    private removePreferred(shortcut: CoinShortcut) {
        delete this.preferred[shortcut];
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
