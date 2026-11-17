import { type TokenDtoV2, type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { type TokenMetadata, type TokenMetadataSource } from '@suite-common/token';
import { toTokenAddress } from '@suite-common/tokens';
import { getNetworkByYieldXyzId } from '@suite-common/wallet-config';

type VaultToken = Pick<TokenDtoV2, 'address' | 'name' | 'symbol' | 'decimals'>;

const toTokenMetadata = (token: VaultToken | undefined): TokenMetadata[] =>
    token?.address
        ? [
              {
                  contract: toTokenAddress(token.address),
                  name: token.name,
                  symbol: token.symbol,
                  decimals: token.decimals,
              },
          ]
        : [];

/** The deposit and receipt tokens of catalog vaults, which accounts mostly do not hold. */
export const yieldVaultsToTokenMetadataSources = (
    vaults: readonly YieldDtoV2[],
): TokenMetadataSource[] =>
    vaults.flatMap(vault => {
        const network = getNetworkByYieldXyzId(vault.network);

        return network
            ? [
                  {
                      networkSymbol: network.symbol,
                      tokens: [
                          ...toTokenMetadata(vault.token),
                          ...toTokenMetadata(vault.outputToken),
                      ],
                  },
              ]
            : [];
    });
