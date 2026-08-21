import { type PublicClient, erc20Abi } from 'viem';

import type { TokenInfo, TokenStandard } from '@trezor/blockchain-link-types';

import { ERC1155_INTERFACE_ID, ERC165_ABI, ERC721_INTERFACE_ID } from './constants';
import { type BatchCall, batchRead } from '../utils/multicall';

type TokenMetadata = {
    name: string;
    symbol: string;
    decimals: number;
    standard: TokenStandard;
};

// Immutable per token, while account info is refetched on every mined block: cache it per
// connection so a refresh only costs the balance read.
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

const toStandard = (isErc721: unknown, isErc1155: unknown): TokenStandard => {
    if (isErc721 === true) return 'ERC721';
    if (isErc1155 === true) return 'ERC1155';

    return 'ERC20';
};

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
    const [name, symbol, decimals, isErc721, isErc1155] = metadataResults;

    const metadata =
        cached ??
        ({
            name: typeof name === 'string' ? name : 'unknown',
            symbol: typeof symbol === 'string' ? symbol : 'unknown',
            decimals: typeof decimals === 'number' ? decimals : 0,
            standard: toStandard(isErc721, isErc1155),
        } satisfies TokenMetadata);

    // Caching a failed read would pin the token to 0 decimals for the whole connection and render
    // every amount 10^decimals too large, so only cache once decimals is actually known. NFTs have
    // no decimals to read, and a name or symbol that stays "unknown" is merely cosmetic.
    const decimalsKnown = typeof decimals === 'number' || metadata.standard !== 'ERC20';

    if (!cached && decimalsKnown) {
        cache.set(cacheKey, metadata);
    }

    const balance = typeof rawBalance === 'bigint' ? rawBalance.toString() : '0';

    if (balance === '0' && !skipBalanceCheck) {
        return null;
    }

    return {
        standard: metadata.standard,
        contract: contractAddress.toLowerCase(),
        balance,
        name: metadata.name,
        symbol: metadata.symbol,
        decimals: metadata.decimals,
    };
};
