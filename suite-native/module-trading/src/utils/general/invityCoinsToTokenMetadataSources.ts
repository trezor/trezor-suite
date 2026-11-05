import { type Coins, type CryptoId } from 'invity-api';

import { cryptoIdToNetworkAndContractAddress } from '@suite-common/trading';
import { type TokenMetadataSource } from '@suite-native/tokens';

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
                              contract: contractAddress,
                              symbol: coin.symbol.toUpperCase(),
                          },
                      ],
                  },
              ]
            : [];
    });
