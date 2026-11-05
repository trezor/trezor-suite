import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TransactionReviewStatefulOutput } from '@suite-common/wallet-types';
import { type TokenMetadata, type TokenMetadataSource } from '@suite-native/tokens';

export const transactionReviewOutputsToTokenMetadataSources = (
    networkSymbol: NetworkSymbol | undefined,
    outputs: readonly TransactionReviewStatefulOutput[] = [],
): TokenMetadataSource[] =>
    networkSymbol
        ? [
              {
                  networkSymbol,
                  tokens: outputs.flatMap<TokenMetadata>(output => {
                      if (output.type === 'rewards') {
                          return output.rewards.map(reward => ({
                              contract: reward.tokenAddress,
                              symbol: reward.tokenSymbol,
                          }));
                      }

                      return output.token ? [output.token] : [];
                  }),
              },
          ]
        : [];
