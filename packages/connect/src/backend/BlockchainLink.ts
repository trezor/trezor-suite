import { BackendManager } from './BackendManager';
import type { BlockchainOptions as Options } from './Blockchain';
import type { CoinInfo } from '../types';

export { Blockchain } from './Blockchain';

const backends = new BackendManager();

export const findBackend = (coin: string, identity?: string) => backends.get(coin, identity);

export const setCustomBackend = (coinInfo: CoinInfo, blockchainLink: CoinInfo['blockchainLink']) =>
    backends.setCustom(
        coinInfo.shortcut,
        blockchainLink?.url.length ? blockchainLink : coinInfo.blockchainLink,
    );

export const isBackendSupported = (coinInfo: CoinInfo) => backends.isSupported(coinInfo);

export const initBlockchain = (
    coinInfo: CoinInfo,
    postMessage: Options['postMessage'],
    identity?: string,
) => backends.getOrConnect({ coinInfo, identity, postMessage });

export const reconnectAllBackends = (coinInfo?: CoinInfo) => backends.reconnectAll(coinInfo);

export const dispose = () => backends.dispose();
