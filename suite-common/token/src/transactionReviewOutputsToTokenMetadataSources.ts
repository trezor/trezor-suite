import { toTokenAddress } from '@suite-common/tokens';
import { type TransactionReviewOutput } from '@suite-common/wallet-types';
import { type NetworkSymbol } from '@trezor/network-module-types';

import { type TokenMetadata, type TokenMetadataSource } from './TokenMetadataContext';

export const transactionReviewOutputsToTokenMetadataSources = (
    networkSymbol: NetworkSymbol | undefined,
    outputs: readonly TransactionReviewOutput[] = [],
): TokenMetadataSource[] =>
    networkSymbol
        ? [
              {
                  networkSymbol,
                  tokens: outputs.flatMap<TokenMetadata>(output => {
                      if (output.type === 'rewards') {
                          return output.rewards.map(reward => ({
                              contract: toTokenAddress(reward.tokenAddress),
                              symbol: reward.tokenSymbol,
                          }));
                      }

                      return output.token
                          ? [{ ...output.token, contract: toTokenAddress(output.token.contract) }]
                          : [];
                  }),
              },
          ]
        : [];
