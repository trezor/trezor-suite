import { createPublicClient } from 'viem';

import { CustomError, RESPONSES } from '@trezor/blockchain-link-types';
import type { MessageTypes, ResponseTypes as Responses } from '@trezor/blockchain-link-types';

import type { Request } from '../types';
import { getTransportType } from '../utils/transportType';

// Block timestamps have a one-second resolution, so a sub-second block time needs a wide window.
export const BLOCK_TIME_SAMPLE_SIZE = 500n;

type BlockTimeSample = { number: bigint; timestamp: bigint };

/**
 * Average block time in seconds between two blocks, or undefined when the window holds no
 * measurable time (a chain younger than one block, or timestamps not moving forward).
 */
export const getAverageBlockTime = (latest: BlockTimeSample, earlier: BlockTimeSample) => {
    const blockCount = latest.number - earlier.number;
    const elapsedSeconds = latest.timestamp - earlier.timestamp;

    if (blockCount <= 0n || elapsedSeconds <= 0n) {
        return undefined;
    }

    return Number(elapsedSeconds) / Number(blockCount);
};

export const getEvmBlockTime = async (
    request: Request<MessageTypes.GetEvmBlockTime>,
): Promise<Responses.GetEvmBlockTime> => {
    const { url } = request.payload;

    const transportType = getTransportType(url);

    if (!transportType) {
        throw new CustomError('invalid_param', 'Invalid URL');
    }

    const client = createPublicClient({
        transport: transportType(url, {
            timeout: 5000,
        }),
    });

    const latest = await client.getBlock();
    const sampleSize =
        latest.number < BLOCK_TIME_SAMPLE_SIZE ? latest.number : BLOCK_TIME_SAMPLE_SIZE;
    const earlier = await client.getBlock({ blockNumber: latest.number - sampleSize });

    const blockTime = getAverageBlockTime(latest, earlier);

    if (blockTime === undefined) {
        throw new CustomError('worker_runtime', 'Block time could not be measured');
    }

    return {
        type: RESPONSES.GET_EVM_BLOCK_TIME,
        payload: blockTime,
    };
};
