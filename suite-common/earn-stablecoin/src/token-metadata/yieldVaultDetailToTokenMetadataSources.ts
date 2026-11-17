import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { type TokenMetadataSource } from '@suite-common/token';
import { type TokenInfoBranded, toTokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';

type YieldVaultDetailToTokenMetadataSourcesParams = {
    networkSymbol: NetworkSymbol;
    yieldToken: TokenInfoBranded;
    vault: YieldDtoV2 | null;
};

export const yieldVaultDetailToTokenMetadataSources = ({
    networkSymbol,
    yieldToken,
    vault,
}: YieldVaultDetailToTokenMetadataSourcesParams): TokenMetadataSource[] => [
    {
        networkSymbol,
        tokens: [
            {
                contract: yieldToken.contract,
                name: yieldToken.name,
                symbol: yieldToken.symbol,
                decimals: yieldToken.decimals,
                standard: yieldToken.standard,
            },
            ...(vault?.token.address
                ? [
                      {
                          contract: toTokenAddress(vault.token.address),
                          symbol: vault.token.symbol,
                          decimals: vault.token.decimals,
                      },
                  ]
                : []),
        ],
    },
];
