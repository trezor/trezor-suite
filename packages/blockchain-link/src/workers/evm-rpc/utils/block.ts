import { PublicClient } from 'viem';

export const calculateBlockTime = async (client: PublicClient): Promise<number | null> => {
    try {
        const latestBlock = await client.getBlock({ blockTag: 'latest' });
        const olderBlock = await client.getBlock({
            blockNumber: latestBlock.number - 10n,
        });

        const timeDiff = Number(latestBlock.timestamp - olderBlock.timestamp);
        const blockDiff = Number(latestBlock.number - olderBlock.number);

        const avgBlockTime = (timeDiff / blockDiff) * 1000;

        return Math.round(avgBlockTime);
    } catch (error) {
        console.warn('[evm-rpc] Failed to calculate block time:', error);

        return null;
    }
};

export const averageRewards = (rewards: bigint[][], percentileIndex: number): bigint => {
    let sum = 0n;
    let count = 0;

    for (const blockRewards of rewards) {
        const reward = blockRewards[percentileIndex];
        if (reward !== null && reward !== undefined) {
            sum += reward;
            count++;
        }
    }

    return count > 0 ? sum / BigInt(count) : 0n;
};
