import { type ReactNode } from 'react';

import { type Coins, type CryptoId } from 'invity-api';

import { cryptoIdToNetworkAndContractAddress } from '@suite-common/trading';
import { TokenMetadataProvider } from '@suite-native/tokens';

type InvityTokenMetadataProviderProps = {
    coins: Coins | undefined;
    children: ReactNode;
};

/** Adapts the Invity catalog to the shared metadata context, preserving trading tickers. */
export const InvityTokenMetadataProvider = ({
    coins,
    children,
}: InvityTokenMetadataProviderProps) => (
    <TokenMetadataProvider
        sources={Object.entries(coins ?? {}).flatMap(([cryptoId, coin]) => {
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
        })}
    >
        {children}
    </TokenMetadataProvider>
);
