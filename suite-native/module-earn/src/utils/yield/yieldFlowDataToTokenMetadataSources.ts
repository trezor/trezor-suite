import { type TokenMetadata, type TokenMetadataSource } from '@suite-common/token';
import { toTokenAddress } from '@suite-common/tokens';
import { type ResolvedYieldFlowData } from '@suite-common/wallet-core';

type TokenFields = Omit<TokenMetadata, 'contract'>;

const toTokenMetadataForContracts = (
    contracts: readonly (string | undefined)[],
    fields: TokenFields,
): TokenMetadata[] => {
    const uniqueContracts = new Set(contracts.filter(contract => typeof contract === 'string'));

    return [...uniqueContracts].map(contract => ({
        ...fields,
        contract: toTokenAddress(contract),
    }));
};

/**
 * Metadata lookups match contracts exactly. The resolved contract of a token the account does not
 * hold is normalized, while screens may still pass the vault's original address, so both are keys.
 */
export const yieldFlowDataToTokenMetadataSources = (
    data: ResolvedYieldFlowData,
): TokenMetadataSource[] => {
    if (data.resolutionStatus !== 'resolved') return [];

    const { token, receiptToken, vault } = data;
    const underlyingContracts = token.contractAddress
        ? [token.contractAddress, vault.token.address]
        : [];
    const receiptContracts = receiptToken.contractAddress
        ? [receiptToken.contractAddress, vault.outputToken?.address]
        : [];

    return [
        {
            networkSymbol: data.account.symbol,
            tokens: [
                ...toTokenMetadataForContracts(underlyingContracts, {
                    name: vault.token.name,
                    symbol: token.symbol,
                    decimals: token.decimals,
                }),
                ...toTokenMetadataForContracts(receiptContracts, {
                    name: vault.outputToken?.name,
                    symbol: receiptToken.symbol,
                    decimals: receiptToken.decimals,
                }),
            ],
        },
    ];
};
