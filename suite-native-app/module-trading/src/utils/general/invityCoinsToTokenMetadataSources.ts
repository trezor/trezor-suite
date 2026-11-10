import { type Coins, type CryptoId } from 'invity-api';

import { type TokenMetadata, type TokenMetadataSource } from '@suite-common/token';
import { toTokenAddress } from '@suite-common/tokens';
import { cryptoIdToNetworkAndContractAddress } from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';

export const invityCoinsToTokenMetadataSources = (
    coins: Coins | undefined,
): TokenMetadataSource[] => {
    const tokensByNetwork = new Map<NetworkSymbol, TokenMetadata[]>();

    for (const [cryptoId, coin] of Object.entries(coins ?? {})) {
        const { network, contractAddress } = cryptoIdToNetworkAndContractAddress(
            cryptoId as CryptoId,
        );
        if (!network || !contractAddress) continue;

        const tokens = tokensByNetwork.get(network.symbol) ?? [];
        tokens.push({
            contract: toTokenAddress(contractAddress),
            name: coin.name,
            symbol: coin.symbol.toUpperCase(),
        });
        tokensByNetwork.set(network.symbol, tokens);
    }

    return Array.from(tokensByNetwork, ([networkSymbol, tokens]) => ({ networkSymbol, tokens }));
};
