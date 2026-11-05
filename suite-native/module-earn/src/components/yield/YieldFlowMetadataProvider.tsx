import { type ReactNode } from 'react';

import { type ResolvedYieldFlowData } from '@suite-common/wallet-core';
import { TokenMetadataProvider } from '@suite-native/tokens';

type YieldFlowMetadataProviderProps = {
    data: ResolvedYieldFlowData;
    children: ReactNode;
};

/** Makes the resolved vault's underlying and receipt tokens available to the entire flow. */
export const YieldFlowMetadataProvider = ({ data, children }: YieldFlowMetadataProviderProps) => {
    if (data.resolutionStatus !== 'resolved') return children;

    return (
        <TokenMetadataProvider
            sources={[
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
            ]}
        >
            {children}
        </TokenMetadataProvider>
    );
};
