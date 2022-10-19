import { BackendManager } from './BackendManager';

import type { BlockchainOptions as Options } from './Blockchain';
import type { CoinInfo } from '../types';

export { Blockchain } from './Blockchain';

const backends = new BackendManager();

export const findBackend = (coin: string) => backends.get(coin);

export const setCustomBackend = (coinInfo: CoinInfo, blockchainLink: CoinInfo['blockchainLink']) =>
    blockchainLink?.url.length
        ? backends.setCustom(coinInfo.shortcut, blockchainLink)
        : backends.removeCustom(coinInfo.shortcut);

export const isBackendSupported = (coinInfo: CoinInfo) => backends.isSupported(coinInfo);

export const initBlockchain = (coinInfo: CoinInfo, postMessage: Options['postMessage']) =>
    backends.getOrConnect(coinInfo, postMessage);

export const reconnectAllBackends = () => backends.reconnectAll();

export const dispose = () => backends.dispose();
