import type { TokenStandard } from '@trezor/blockchain-link-types';
import {
    type EthereumNetworkSymbol,
    isSupportedEthereumNetwork,
} from '@trezor/network-ethereum-types';
import { ChainNetworkError } from '@trezor/network-module-suite-common-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { getAccountSyncInterval, getNetworkConfig } from '../networkConfig';

/** Token standards EVM networks hold as fungible balances; NFT standards are left out. */
export const EVM_FUNGIBLE_TOKEN_STANDARDS: readonly TokenStandard[] = ['ERC20', 'BEP20'];

/** What every EVM chain network needs to know about its symbol. */
export const getEthereumChainNetworkConfig = (symbol: NetworkSymbol) => {
    if (!isSupportedEthereumNetwork(symbol)) {
        throw new ChainNetworkError('unsupported-network', symbol);
    }

    const ethereumSymbol: EthereumNetworkSymbol = symbol;
    const config = getNetworkConfig(ethereumSymbol);

    return {
        nativeAsset: {
            symbol: config.displaySymbol,
            name: config.displaySymbolName ?? config.name,
        },
        decimals: config.decimals,
        accountSyncIntervalMs: getAccountSyncInterval(ethereumSymbol),
        hasFiatRate: !config.testnet,
        hasBlockbookRates: config.backendOptions.some(option => option.type === 'blockbook'),
    };
};
