import { type TokenMetadata, type TokenMetadataSource } from '@suite-common/token';
import { toTokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TransactionReviewStatefulOutput } from '@suite-common/wallet-types';

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
