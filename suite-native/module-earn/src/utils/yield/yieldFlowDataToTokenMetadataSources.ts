import { type ResolvedYieldFlowData } from '@suite-common/wallet-core';
import { type TokenMetadataSource } from '@suite-native/tokens';

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
                              contract: data.token.contractAddress,
                          },
                      ]
                    : []),
                ...(data.receiptToken.contractAddress
                    ? [
                          {
                              ...data.vault.outputToken,
                              ...data.receiptToken,
                              contract: data.receiptToken.contractAddress,
                          },
                      ]
                    : []),
            ],
        },
    ];
};
