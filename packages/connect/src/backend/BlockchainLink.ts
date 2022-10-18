import { config } from '../data/config';
import { DataManager } from '../data/DataManager';
import { ERRORS } from '../constants';
import { Blockchain, BlockchainOptions as Options } from './Blockchain';
import type { CoinInfo } from '../types';

export { Blockchain };

const instances: Blockchain[] = [];
const customBackends: { [coin: string]: CoinInfo } = {};
const preferredBackends: { [coin: string]: CoinInfo } = {};

const removeBackend = (backend: Blockchain) => {
    const index = instances.indexOf(backend);
    if (index >= 0) {
        instances.splice(index, 1);
    }
};

export const findBackend = (shortcut: string) => {
    for (let i = 0; i < instances.length; i++) {
        if (instances[i].coinInfo.shortcut === shortcut) {
            return instances[i];
        }
    }
    return null;
};

// keep backend as a preferred once connection is successfully made
// switching between urls could lead to side effects (mempool differences, non existing/missing pending transactions)
const setPreferredBacked = (coinInfo: CoinInfo, url?: string) => {
    if (!url) {
        delete preferredBackends[coinInfo.shortcut];
    } else if (coinInfo.blockchainLink) {
        preferredBackends[coinInfo.shortcut] = {
            ...coinInfo,
            blockchainLink: {
                ...coinInfo.blockchainLink,
                url: [url],
            },
        };
    }
};

export const setCustomBackend = (
    coinInfo: CoinInfo,
    blockchainLink: CoinInfo['blockchainLink'],
) => {
    setPreferredBacked(coinInfo); // reset preferred backend
    if (!blockchainLink || blockchainLink.url.length === 0) {
        delete customBackends[coinInfo.shortcut];
    } else {
        customBackends[coinInfo.shortcut] = {
            ...coinInfo,
            blockchainLink,
        };
    }
};

export const isBackendSupported = (coinInfo: CoinInfo) => {
    const info = customBackends[coinInfo.shortcut] || coinInfo;
    if (!info.blockchainLink) {
        throw ERRORS.TypedError('Backend_NotSupported');
    }
};

export const initBlockchain = async (coinInfo: CoinInfo, postMessage: Options['postMessage']) => {
    let backend = findBackend(coinInfo.name);
    if (!backend) {
        backend = new Blockchain({
            coinInfo:
                preferredBackends[coinInfo.shortcut] ||
                customBackends[coinInfo.shortcut] ||
                coinInfo,
            postMessage,
            debug: DataManager.getSettings('debug'),
            proxy: DataManager.getSettings('proxy'),
            onionDomains:
                DataManager.getSettings('useOnionLinks') && !customBackends[coinInfo.shortcut]
                    ? config.onionDomains
                    : undefined,
            onConnected: setPreferredBacked,
            onDisconnected: removeBackend,
        });
        instances.push(backend);

        try {
            await backend.init();
        } catch (error) {
            removeBackend(backend);
            setPreferredBacked(coinInfo); // reset preferred backend
            throw error;
        }
    }
    return backend;
};

export const reconnectAllBackends = () => {
    // collect all running backends as parameters tuple
    const params: [CoinInfo, Options['postMessage']][] = instances.map(i => [
        i.coinInfo,
        i.postMessage,
    ]);
    // remove all backends
    while (instances.length > 0) {
        instances[0].disconnect();
    }
    // initialize again using params tuple
    return Promise.all(params.map(p => initBlockchain(...p)));
};

export const dispose = () => {
    while (instances.length > 0) {
        instances[0].disconnect();
    }
};
