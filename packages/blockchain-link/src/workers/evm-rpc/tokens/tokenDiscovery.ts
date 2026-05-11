import { type Log, type PublicClient, parseAbiItem } from 'viem';

import type { TokenInfo } from '@trezor/blockchain-link-types';
import { unique } from '@trezor/utils';

import { getTokenInfo } from './tokenInfo';
import { TOKEN_DISCOVERY } from '../constants';

const transferEvent = parseAbiItem(
    'event Transfer(address indexed from, address indexed to, uint256 value)',
);

const fetchLogsInChunks = async (
    client: PublicClient,
    from: `0x${string}` | null,
    to: `0x${string}` | null,
    latestBlock: bigint,
): Promise<Log[]> => {
    const allLogs: Log[] = [];

    const startBlock = latestBlock - BigInt(TOKEN_DISCOVERY.MAX_BLOCKS_TO_CHECK);
    const startBlockSafe = startBlock < 0n ? 0n : startBlock;

    for (
        let fromBlock = startBlockSafe;
        fromBlock < latestBlock;
        fromBlock += BigInt(TOKEN_DISCOVERY.CHUNK_SIZE)
    ) {
        const toBlock = fromBlock + BigInt(TOKEN_DISCOVERY.CHUNK_SIZE) - 1n;
        const toBlockSafe = toBlock > latestBlock ? latestBlock : toBlock;

        try {
            const logs = await client.getLogs({
                event: transferEvent,
                args: {
                    from,
                    to,
                },
                fromBlock,
                toBlock: toBlockSafe,
            });
            allLogs.push(...logs);
        } catch (error) {
            console.warn(
                `[evm-rpc] Failed to fetch logs for blocks ${fromBlock}-${toBlockSafe}:`,
                error,
            );
        }
    }

    return allLogs;
};

export const discoverTokens = async (
    client: PublicClient,
    userAddress: string,
): Promise<TokenInfo[]> => {
    const address = userAddress as `0x${string}`;

    let latestBlock: bigint;
    try {
        latestBlock = await client.getBlockNumber();
    } catch (error) {
        console.warn('[evm-rpc] Failed to get block number:', error);

        return [];
    }

    let incomingLogs: Log[];
    let outgoingLogs: Log[];

    try {
        [incomingLogs, outgoingLogs] = await Promise.all([
            fetchLogsInChunks(client, null, address, latestBlock),
            fetchLogsInChunks(client, address, null, latestBlock),
        ]);
    } catch (error) {
        console.warn('[evm-rpc] Failed to fetch token logs:', error);

        return [];
    }

    const allLogs = [...incomingLogs, ...outgoingLogs];
    const contractAddresses = unique(allLogs.map(log => log.address.toLowerCase()));

    if (contractAddresses.length === 0) {
        return [];
    }

    const tokenPromises = contractAddresses.map(contractAddress =>
        getTokenInfo(client, userAddress as `0x${string}`, contractAddress as `0x${string}`),
    );

    const tokens = await Promise.all(tokenPromises);

    return tokens.filter((token): token is TokenInfo => token !== null);
};
