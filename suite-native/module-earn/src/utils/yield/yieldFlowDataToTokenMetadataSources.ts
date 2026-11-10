import { type TokenMetadataSource } from '@suite-common/token';
import { toTokenAddress } from '@suite-common/tokens';
import { type ResolvedYieldFlowData } from '@suite-common/wallet-core';

export const yieldFlowDataToTokenMetadataSources = (
    data: ResolvedYieldFlowData,
): TokenMetadataSource[] => {
    if (data.resolutionStatus !== 'resolved') return [];

    return [
        {
            networkSymbol: data.account.symbol,
            tokens: [
                ...(data.token.contractAddress
                    ? [
                          {
                              ...data.vault.token,
                              ...data.token,
                              contract: toTokenAddress(data.token.contractAddress),
                          },
                      ]
                    : []),
                ...(data.receiptToken.contractAddress
                    ? [
                          {
                              ...data.vault.outputToken,
                              ...data.receiptToken,
                              contract: toTokenAddress(data.receiptToken.contractAddress),
                          },
                      ]
                    : []),
            ],
        },
    ];
};
