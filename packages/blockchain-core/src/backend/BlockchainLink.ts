import { ERRORS } from '@trezor/connect-common/src/constants';

import { BackendManager } from './BackendManager';
import type { BlockchainOptions as Options, PostMessage, Proxy } from './Blockchain';
import {
    type BackendCoinInfo,
    type BlockchainLinkSettings,
    getBackendCoinInfo,
} from '../data/coinInfo';

export { Blockchain } from './Blockchain';

const backends = new BackendManager();

export const findBackend = (coin: string, identity?: string) => backends.get(coin, identity);

export const setCustomBackend = (
    coinInfo: BackendCoinInfo,
    blockchainLink: BlockchainLinkSettings | undefined,
) =>
    backends.setCustom(
        coinInfo.shortcut,
        blockchainLink?.url.length ? blockchainLink : coinInfo.blockchainLink,
    );

export const assertBackendSupported = (coinInfo: BackendCoinInfo) => {
    if (!backends.isSupported(coinInfo)) {
        throw ERRORS.TypedError('Backend_NotSupported');
    }
};

export const initBlockchain = (
    coinInfo: BackendCoinInfo,
    postMessage: Options['postMessage'],
    identity?: string,
    options?: { force?: boolean },
) => backends.getOrConnect({ coinInfo, identity, postMessage }, options);

/** Connects the backend of the coin for the identity, or reuses its connection. */
export const initCoinBackend = (
    { coin, identity }: { coin: string; identity?: string },
    postMessage: PostMessage,
    options?: { force?: boolean },
) => {
    const coinInfo = getBackendCoinInfo(coin);
    assertBackendSupported(coinInfo);

    return initBlockchain(coinInfo, postMessage, identity, options);
};

export const reconnectAllBackends = (coinInfo?: BackendCoinInfo) => backends.reconnectAll(coinInfo);

export const updateProxy = (proxy?: Proxy) => backends.updateProxy(proxy);

export const setDebug = (debug = false) => backends.setDebug(debug);

export const dispose = () => backends.dispose();
