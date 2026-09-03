import type { Account, StellarTokenInfo } from '@suite-common/wallet-types';
import type { TokenDetailByMint } from '@trezor/blockchain-link-types';
import { getTokenMetadata } from '@trezor/blockchain-link-utils/src/stellar';
import { STELLAR_DECIMALS } from '@trezor/network-stellar/constants';
import stellar from '@trezor/network-stellar/runtime';
import { createLazy } from '@trezor/utils';

export const lazyStellarTokenMetadata = createLazy(getTokenMetadata);

// Deriving a Stellar Asset Contract id from an asset is a one-way hash, so the only way back
// is to derive the id of every asset we know of and match. Keyed on the metadata object so
// the work happens once per definitions payload.
const contractIndexes = new WeakMap<TokenDetailByMint, Map<string, string>>();

const getSacContractIndex = async (tokenMetadata: TokenDetailByMint) => {
    const cached = contractIndexes.get(tokenMetadata);
    if (cached) return cached;

    const { computeSorobanAssetContractId } = await stellar();
    const index = new Map<string, string>();

    Object.keys(tokenMetadata).forEach(contract => {
        try {
            index.set(computeSorobanAssetContractId(contract).sorobanAssetContractId, contract);
        } catch {
            // The definitions can hold entries that are not classic `CODE-ISSUER` assets
        }
    });

    contractIndexes.set(tokenMetadata, index);

    return index;
};

/**
 * Resolves a Stellar Asset Contract id (`C…`) to the classic asset it wraps. Only assets
 * present in the token definitions can be resolved; anything else has to be entered as an
 * asset code and issuer. Contract ids are network specific and this covers mainnet only,
 * matching the rest of the Stellar token management flow.
 */
export const resolveStellarAssetFromContractId = async (
    contractId: string,
    tokenMetadata: TokenDetailByMint,
): Promise<{ assetCode: string; assetIssuer: string } | undefined> => {
    const { isValidContractId } = await stellar();

    if (!isValidContractId(contractId)) return undefined;

    const classicContract = (await getSacContractIndex(tokenMetadata)).get(contractId);
    if (!classicContract) return undefined;

    const [assetCode, assetIssuer] = classicContract.split('-');

    return assetCode && assetIssuer ? { assetCode, assetIssuer } : undefined;
};

/** As `resolveStellarAssetFromContractId`, reading the token definitions through the shared holder. */
export const resolveStellarContractId = async (contractId: string) =>
    resolveStellarAssetFromContractId(contractId, await lazyStellarTokenMetadata.getOrInit());

/** Get the list of inactive Stellar tokens for the user account */
export const getStellarInactiveTokens = async (account: Account): Promise<StellarTokenInfo[]> => {
    if (account.symbol !== 'xlm') return [];

    const allTokens: TokenDetailByMint = await getTokenMetadata();

    // Get the currently active token contract addresses for the user
    const activeTokenContracts = new Set(account.tokens?.map(token => token.contract) || []);

    // Return tokens that the user has not activated yet
    const inactiveTokens = Object.entries(allTokens)
        .filter(([contractAddress]) => !activeTokenContracts.has(contractAddress))
        .map(([contract]) => ({
            type: 'STELLAR-CLASSIC' as const,
            standard: 'STELLAR-CLASSIC' as const,
            contract,
            name: allTokens[contract]?.name,
            symbol: contract.split('-')[0],
            decimals: STELLAR_DECIMALS,
            homeDomain: allTokens[contract]?.home_domain,
            rating: allTokens[contract]?.rating,
        }))
        .sort((a, b) => {
            // Place tokens without ratings last, otherwise sort high to low
            if (a.rating == null && b.rating == null) return 0;
            if (a.rating == null) return 1;
            if (b.rating == null) return -1;

            return b.rating - a.rating;
        });

    return inactiveTokens;
};
