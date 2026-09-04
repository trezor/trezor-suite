import type { Account, StellarTokenInfo } from '@suite-common/wallet-types';
import type { TokenDetailByMint } from '@trezor/blockchain-link-types';
import { getTokenMetadata } from '@trezor/blockchain-link-utils/src/stellar';
import { STELLAR_DECIMALS, STELLAR_MEMO_TEXT_MAX_BYTES } from '@trezor/network-stellar/constants';
import stellar from '@trezor/network-stellar/runtime';
import { createLazy } from '@trezor/utils';

export const lazyStellarTokenMetadata = createLazy(getTokenMetadata);

// Deriving a Stellar Asset Contract id from an asset is a one-way hash, so the only way back
// is to derive the id of every asset we know of and match. Keyed on the metadata object so
// the work happens once per definitions payload; the in-flight promise is cached rather than
// the map, so two lookups racing the first build share it instead of both hashing.
const contractIndexes = new WeakMap<TokenDetailByMint, Promise<Map<string, string>>>();

// Hashing the whole definitions list is hundreds of assets of uninterrupted work, and the first
// lookup lands on a paste into the token input. Yielding between chunks keeps that paste from
// dropping frames.
const SAC_INDEX_CHUNK_SIZE = 100;

const buildSacContractIndex = async (tokenMetadata: TokenDetailByMint) => {
    const { computeSorobanAssetContractId } = await stellar();
    const index = new Map<string, string>();
    const contracts = Object.keys(tokenMetadata);

    for (let offset = 0; offset < contracts.length; offset += SAC_INDEX_CHUNK_SIZE) {
        if (offset > 0) {
            await new Promise(resolve => {
                setTimeout(resolve, 0);
            });
        }

        contracts.slice(offset, offset + SAC_INDEX_CHUNK_SIZE).forEach(contract => {
            try {
                index.set(computeSorobanAssetContractId(contract).sorobanAssetContractId, contract);
            } catch {
                // The definitions can hold entries that are not classic `CODE-ISSUER` assets
            }
        });
    }

    return index;
};

const getSacContractIndex = (tokenMetadata: TokenDetailByMint) => {
    const cached = contractIndexes.get(tokenMetadata);
    if (cached) return cached;

    const pending = buildSacContractIndex(tokenMetadata).catch(error => {
        // A failed build says nothing about the definitions, so it must not be cached
        contractIndexes.delete(tokenMetadata);
        throw error;
    });

    contractIndexes.set(tokenMetadata, pending);

    return pending;
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

const fitMemoText = (text: string) => {
    const characters = Array.from(text.trim());

    while (Buffer.byteLength(characters.join(''), 'utf8') > STELLAR_MEMO_TEXT_MAX_BYTES) {
        characters.pop();
    }

    return characters.join('').trimEnd();
};

/**
 * Memo for a trustline change. The asset code and issuer are already spelled out by the
 * operation itself, so the only thing worth writing is the token name from the definitions.
 */
export const getStellarTrustlineMemoFromMetadata = (
    contract: string,
    tokenMetadata: TokenDetailByMint,
): string | undefined => {
    const memo = fitMemoText(tokenMetadata[contract]?.name ?? '');

    return memo || undefined;
};

/** As `getStellarTrustlineMemoFromMetadata`, reading the definitions through the shared holder. */
export const getStellarTrustlineMemo = async (contract: string) => {
    try {
        return getStellarTrustlineMemoFromMetadata(
            contract,
            await lazyStellarTokenMetadata.getOrInit(),
        );
    } catch {
        // The definitions are only a nicety here, a trustline signs and settles without a memo
        return undefined;
    }
};

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
