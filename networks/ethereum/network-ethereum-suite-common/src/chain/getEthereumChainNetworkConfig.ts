import type { TokenStandard } from '@trezor/blockchain-link-types';
import { isSupportedEthereumNetwork } from '@trezor/network-ethereum-types';
import {
    type ConnectChainNetworkTokens,
    readChainNetworkConfig,
} from '@trezor/network-module-suite-common-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { getAccountSyncInterval, getNetworkConfig } from '../networkConfig';

/** Token standards EVM networks hold as fungible balances; NFT standards are left out. */
const EVM_FUNGIBLE_TOKEN_STANDARDS: readonly TokenStandard[] = ['ERC20', 'BEP20'];

/** How every EVM network reads tokens: custom tokens one by one, contracts in any letter case. */
export const getEvmTokenRules = (): Pick<
    ConnectChainNetworkTokens,
    'fungibleStandards' | 'details' | 'watchedTokensStrategy'
> => ({
    fungibleStandards: EVM_FUNGIBLE_TOKEN_STANDARDS,
    details: 'tokenBalances',
    watchedTokensStrategy: { type: 'contract-filter', isContractCaseInsensitive: true },
});

/** What every EVM chain network needs to know about its symbol. */
export const getEthereumChainNetworkConfig = (symbol: NetworkSymbol) =>
    readChainNetworkConfig(
        {
            isSupportedNetwork: isSupportedEthereumNetwork,
            getNetworkConfig,
            getAccountSyncInterval,
        },
        symbol,
    );
