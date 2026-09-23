import type { CoinInfo, Proxy } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';

import { BackendManager } from './BackendManager';
import type { BlockchainOptions as Options } from './Blockchain';

export { Blockchain } from './Blockchain';

const backends = new BackendManager();

export const findBackend = (coin: string, identity?: string) => backends.get(coin, identity);

// Without custom urls the default backend stays, but a custom broadcast backend still applies to it.
export const getCustomBlockchainLink = (
    coinInfo: CoinInfo,
    blockchainLink: CoinInfo['blockchainLink'],
): CoinInfo['blockchainLink'] => {
    const primary = blockchainLink?.url.length ? blockchainLink : coinInfo.blockchainLink;
    const broadcast = blockchainLink?.broadcast;

    return primary && broadcast?.url.length ? { ...primary, broadcast } : primary;
};

export const setCustomBackend = (coinInfo: CoinInfo, blockchainLink: CoinInfo['blockchainLink']) =>
    backends.setCustom(coinInfo.shortcut, getCustomBlockchainLink(coinInfo, blockchainLink));

export const assertBackendSupported = (coinInfo: CoinInfo) => {
    if (!backends.isSupported(coinInfo)) {
        throw ERRORS.TypedError('Backend_NotSupported');
    }
};

export const initBlockchain = (
    coinInfo: CoinInfo,
    postMessage: Options['postMessage'],
    identity?: string,
    options?: { force?: boolean },
) => backends.getOrConnect({ coinInfo, identity, postMessage }, options);

export const reconnectAllBackends = (coinInfo?: CoinInfo) => backends.reconnectAll(coinInfo);

export const updateProxy = (proxy?: Proxy) => backends.updateProxy(proxy);

export const dispose = () => backends.dispose();
