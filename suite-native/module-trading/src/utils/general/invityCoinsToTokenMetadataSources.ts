import { type Coins, type CryptoId } from 'invity-api';

import { type TokenMetadataSource } from '@suite-common/token';
import { toTokenAddress } from '@suite-common/tokens';
import { cryptoIdToNetworkAndContractAddress } from '@suite-common/trading';

export const invityCoinsToTokenMetadataSources = (
    coins: Coins | undefined,
): TokenMetadataSource[] =>
    Object.entries(coins ?? {}).flatMap(([cryptoId, coin]) => {
        const { network, contractAddress } = cryptoIdToNetworkAndContractAddress(
            cryptoId as CryptoId,
        );

        return network && contractAddress
            ? [
                  {
                      networkSymbol: network.symbol,
                      tokens: [
                          {
                              ...coin,
                              contract: toTokenAddress(contractAddress),
                              symbol: coin.symbol.toUpperCase(),
                          },
                      ],
                  },
              ]
            : [];
    });
