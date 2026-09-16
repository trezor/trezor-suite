import { type PublicClient, erc20Abi } from 'viem';

import type { TokenInfo, TokenStandard } from '@trezor/blockchain-link-types';

import { ERC1155_INTERFACE_ID, ERC165_ABI, ERC721_INTERFACE_ID } from './constants';
import { type BatchCall, batchRead } from '../utils/multicall';

export type TokenMetadata = {
    name: string;
    symbol: string;
    decimals: number;
    standard: TokenStandard;
};

// Immutable per token, while account info is refetched on every mined block: cache it per
// connection so a refresh only costs the balance read. Keyed weakly, so the entries go away with
// the client when the connection is torn down.
const metadataCaches = new WeakMap<PublicClient, Map<string, TokenMetadata>>();

const getMetadataCache = (client: PublicClient) => {
    const existing = metadataCaches.get(client);
    if (existing) return existing;

    const cache = new Map<string, TokenMetadata>();
    metadataCaches.set(client, cache);

    return cache;
};

const balanceCall = (contract: `0x${string}`, userAddress: `0x${string}`): BatchCall => ({
    address: contract,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [userAddress],
});

const metadataCalls = (contract: `0x${string}`): BatchCall[] => [
    { address: contract, abi: erc20Abi, functionName: 'name' },
    { address: contract, abi: erc20Abi, functionName: 'symbol' },
    { address: contract, abi: erc20Abi, functionName: 'decimals' },
    {
        address: contract,
        abi: ERC165_ABI,
        functionName: 'supportsInterface',
        args: [ERC721_INTERFACE_ID],
    },
    {
        address: contract,
        abi: ERC165_ABI,
        functionName: 'supportsInterface',
        args: [ERC1155_INTERFACE_ID],
    },
];

const METADATA_CALL_COUNT = 5;

const toStandard = (isErc721: unknown, isErc1155: unknown): TokenStandard => {
    if (isErc721 === true) return 'ERC721';
    if (isErc1155 === true) return 'ERC1155';

    return 'ERC20';
};

const assembleMetadata = (results: unknown[]): { metadata: TokenMetadata; cacheable: boolean } => {
    const [name, symbol, decimals, isErc721, isErc1155] = results;
    const standard = toStandard(isErc721, isErc1155);

    return {
        metadata: {
            name: typeof name === 'string' ? name : 'unknown',
            symbol: typeof symbol === 'string' ? symbol : 'unknown',
            decimals: typeof decimals === 'number' ? decimals : 0,
            standard,
        },
        // Caching a failed read would pin the token to 0 decimals for the whole connection and
        // render every amount 10^decimals too large, so only cache once decimals is actually
        // known. NFTs have no decimals to read, and a name or symbol that stays "unknown" is
        // merely cosmetic.
        cacheable: typeof decimals === 'number' || standard !== 'ERC20',
    };
};

const toTokenInfo = (
    contract: `0x${string}`,
    metadata: TokenMetadata,
    balance: string,
): TokenInfo => ({
    standard: metadata.standard,
    contract: contract.toLowerCase(),
    balance,
    name: metadata.name,
    symbol: metadata.symbol,
    decimals: metadata.decimals,
});

const toBalance = (raw: unknown) => (typeof raw === 'bigint' ? raw.toString() : '0');

export const getTokenInfo = async (
    client: PublicClient,
    userAddress: `0x${string}`,
    contractAddress: `0x${string}`,
    skipBalanceCheck = false,
): Promise<TokenInfo | null> => {
    const cache = getMetadataCache(client);
    const cacheKey = contractAddress.toLowerCase();
    const cached = cache.get(cacheKey);

    const calls = cached
        ? [balanceCall(contractAddress, userAddress)]
        : [balanceCall(contractAddress, userAddress), ...metadataCalls(contractAddress)];

    const [rawBalance, ...metadataResults] = await batchRead(client, calls);

    let metadata = cached;
    if (!metadata) {
        const assembled = assembleMetadata(metadataResults);
        metadata = assembled.metadata;
        if (assembled.cacheable) {
            cache.set(cacheKey, metadata);
        }
    }

    const balance = toBalance(rawBalance);

    if (balance === '0' && !skipBalanceCheck) {
        return null;
    }

    return toTokenInfo(contractAddress, metadata, balance);
};

/**
 * Balances plus metadata for many contracts in a single batch. Token discovery hands over every
 * contract it has ever seen touch the account, and that list is re-read on every account refresh,
 * so one request for the whole set is the difference between usable and rate-limited.
 */
export const getTokenInfos = async (
    client: PublicClient,
    userAddress: `0x${string}`,
    contractAddresses: readonly `0x${string}`[],
): Promise<TokenInfo[]> => {
    if (!contractAddresses.length) return [];

    const cache = getMetadataCache(client);
    const calls: BatchCall[] = [];
    const layout = contractAddresses.map(contract => {
        const cached = cache.get(contract.toLowerCase());
        const balanceIndex = calls.length;
        calls.push(balanceCall(contract, userAddress));

        const metadataIndex = cached ? undefined : calls.length;
        if (!cached) {
            calls.push(...metadataCalls(contract));
        }

        return { contract, cached, balanceIndex, metadataIndex };
    });

    const results = await batchRead(client, calls);

    return layout.map(({ contract, cached, balanceIndex, metadataIndex }) => {
        let metadata = cached;
        if (!metadata && metadataIndex !== undefined) {
            const assembled = assembleMetadata(
                results.slice(metadataIndex, metadataIndex + METADATA_CALL_COUNT),
            );
            metadata = assembled.metadata;
            if (assembled.cacheable) {
                cache.set(contract.toLowerCase(), metadata);
            }
        }

        return toTokenInfo(
            contract,
            metadata ?? { name: 'unknown', symbol: 'unknown', decimals: 0, standard: 'ERC20' },
            toBalance(results[balanceIndex]),
        );
    });
};

/** Metadata only, for labelling transfers of tokens whose balance is irrelevant. */
export const getTokenMetadataMap = async (
    client: PublicClient,
    contractAddresses: readonly `0x${string}`[],
): Promise<Map<string, TokenMetadata>> => {
    const cache = getMetadataCache(client);
    const map = new Map<string, TokenMetadata>();

    const missing: `0x${string}`[] = [];
    contractAddresses.forEach(contract => {
        const key = contract.toLowerCase();
        const cached = cache.get(key);
        if (cached) {
            map.set(key, cached);
        } else if (!missing.some(pending => pending.toLowerCase() === key)) {
            missing.push(contract);
        }
    });

    if (!missing.length) return map;

    const results = await batchRead(client, missing.flatMap(metadataCalls));

    missing.forEach((contract, index) => {
        const assembled = assembleMetadata(
            results.slice(index * METADATA_CALL_COUNT, (index + 1) * METADATA_CALL_COUNT),
        );
        const key = contract.toLowerCase();
        map.set(key, assembled.metadata);
        if (assembled.cacheable) {
            cache.set(key, assembled.metadata);
        }
    });

    return map;
};
