import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { type CryptoId } from 'invity-api';

import { cryptoIdToNetworkAndContractAddress, selectTradingCoins } from '@suite-common/trading';
import { selectAccounts } from '@suite-common/wallet-core';
import { TokenMetadataProvider, type TokenMetadataSource } from '@suite-native/tokens';

type TradingMetadataProviderProps = { children: ReactNode };

/** Composes discovered holdings and the trading catalog before trading UI is rendered. */
export const TradingMetadataProvider = ({ children }: TradingMetadataProviderProps) => {
    const accounts = useSelector(selectAccounts);
    const coins = useSelector(selectTradingCoins);
    const catalogSources: TokenMetadataSource[] = Object.entries(coins ?? {}).flatMap(
        ([cryptoId, coin]) => {
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
        },
    );

    return (
        <TokenMetadataProvider
            sources={[
                ...catalogSources,
                ...accounts.map(account => ({
                    networkSymbol: account.symbol,
                    tokens: account.tokens ?? [],
                })),
            ]}
        >
            {children}
        </TokenMetadataProvider>
    );
};
