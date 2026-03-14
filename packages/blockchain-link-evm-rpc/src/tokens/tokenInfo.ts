import { PublicClient, erc20Abi } from 'viem';

import type { TokenInfo, TokenStandard } from '@trezor/blockchain-link-types';

import { ERC1155_INTERFACE_ID, ERC165_ABI, ERC721_INTERFACE_ID } from './constants';

const getTokenMetadata = async (
    client: PublicClient,
    address: `0x${string}`,
): Promise<{ name: string; symbol: string; decimals: number }> => {
    try {
        const [name, symbol, decimals] = await Promise.all([
            client
                .readContract({ address, abi: erc20Abi, functionName: 'name' })
                .catch(() => 'unknown' as const),
            client
                .readContract({ address, abi: erc20Abi, functionName: 'symbol' })
                .catch(() => 'unknown' as const),
            client
                .readContract({ address, abi: erc20Abi, functionName: 'decimals' })
                .catch(() => 0),
        ]);

        return { name, symbol, decimals };
    } catch {
        return { name: 'unknown', symbol: 'unknown', decimals: 0 };
    }
};

const getTokenBalance = async (
    client: PublicClient,
    contractAddress: `0x${string}`,
    userAddress: `0x${string}`,
): Promise<string> => {
    try {
        const balance = await client.readContract({
            abi: erc20Abi,
            functionName: 'balanceOf',
            address: contractAddress,
            args: [userAddress],
        });

        return balance.toString();
    } catch {
        return '0';
    }
};

const supportsInterface = async (
    client: PublicClient,
    address: `0x${string}`,
    interfaceId: `0x${string}`,
): Promise<boolean> => {
    try {
        return await client.readContract({
            abi: ERC165_ABI,
            functionName: 'supportsInterface',
            address,
            args: [interfaceId],
        });
    } catch {
        return false;
    }
};

const detectTokenType = async (
    client: PublicClient,
    address: `0x${string}`,
): Promise<TokenStandard> => {
    try {
        const [isERC721, isERC1155] = await Promise.all([
            supportsInterface(client, address, ERC721_INTERFACE_ID),
            supportsInterface(client, address, ERC1155_INTERFACE_ID),
        ]);

        if (isERC721) {
            return 'ERC721';
        }

        if (isERC1155) {
            return 'ERC1155';
        }

        try {
            await client.readContract({
                abi: erc20Abi,
                functionName: 'balanceOf',
                address,
                args: ['0x0000000000000000000000000000000000000000'],
            });

            return 'ERC20';
        } catch {
            // TODO: handle this better
            return 'ERC20';
        }
    } catch {
        // TODO: handle this better
        return 'ERC20';
    }
};

export const getTokenInfo = async (
    client: PublicClient,
    userAddress: `0x${string}`,
    contractAddress: `0x${string}`,
    skipBalanceCheck = false,
): Promise<TokenInfo | null> => {
    const [balance, metadata, tokenType] = await Promise.all([
        getTokenBalance(client, contractAddress, userAddress),
        getTokenMetadata(client, contractAddress),
        detectTokenType(client, contractAddress),
    ]);

    if (balance === '0' && !skipBalanceCheck) {
        return null;
    }

    return {
        standard: tokenType,
        contract: contractAddress.toLowerCase(),
        balance,
        name: metadata.name,
        symbol: metadata.symbol,
        decimals: metadata.decimals,
    };
};
