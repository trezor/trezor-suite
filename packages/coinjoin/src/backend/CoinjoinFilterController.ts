import { createCooldown } from '@trezor/utils';

import { PROGRESS_INFO_COOLDOWN } from '../constants';
import type {
    FilterClient,
    FilterControllerParams,
    FilterControllerContext,
} from '../types/backend';
import type { CoinjoinBackendSettings } from '../types';

export type FilterController = Pick<CoinjoinFilterController, 'getFilterIterator'>;

export class CoinjoinFilterController {
    private readonly client;
    private readonly batchSize;
    private readonly baseBlock;

    constructor(
        client: FilterClient,
        { baseBlockHash, baseBlockHeight, filtersBatchSize }: CoinjoinBackendSettings,
    ) {
        this.client = client;
        this.batchSize = filtersBatchSize;
        this.baseBlock = {
            blockHash: baseBlockHash,
            blockHeight: baseBlockHeight,
        };
    }

    async *getFilterIterator(
        params: FilterControllerParams,
        { abortSignal, onProgressInfo }: FilterControllerContext = {},
    ) {
        const batchSize = params?.batchSize ?? this.batchSize;
        const [latestCheckpoint, ...olderCheckpoints] = params?.checkpoints?.length
            ? params.checkpoints
            : [this.baseBlock];

        const fetchFilterBatch = async ({ blockHeight, blockHash }: typeof latestCheckpoint) => ({
            height: blockHeight,
            hash: blockHash,
            response: await this.client.fetchBlockFilters(blockHash, batchSize, {
                signal: abortSignal,
            }),
        });

        onProgressInfo?.({
            stage: 'block',
            activity: 'fetch',
            batchFrom: latestCheckpoint.blockHeight,
        });

        // Try to fetch filters from the latest checkpoint
        let batch = await fetchFilterBatch(latestCheckpoint);

        // Backward phase:
        // Try to rollback through the older checkpoints as long as 'not-found' (handles reorgs)

        for (const checkpoint of olderCheckpoints) {
            if (batch.response.status !== 'not-found') break;

            batch = await fetchFilterBatch(checkpoint);
        }

        // Forward phase:
        // If there are filters, iterate over them and fetch subsequent batch
        if (batch.response.status === 'ok') {
            const from = batch.height;
            const { bestHeight } = await this.client.fetchNetworkInfo({ signal: abortSignal });
            const progressCooldown = createCooldown(PROGRESS_INFO_COOLDOWN);
            do {
                const { filters, M, P, zeroedKey } = batch.response;
                const [last] = filters.slice(-1);

                // In case of new block mined during the discovery, its height
                // is used as `to` instead of `bestHeight` from the beginning
                const to = Math.max(bestHeight, last.blockHeight);

                onProgressInfo?.({
                    stage: 'block',
                    activity: 'scan-fetch',
                    batchFrom: last.blockHeight,
                });

                const nextBatchPromise = fetchFilterBatch(last).finally(() => {
                    onProgressInfo?.({
                        stage: 'block',
                        activity: 'scan',
                        batchFrom: last.blockHeight,
                    });
                });

                for (const filter of filters) {
                    const filterParams = { M, P, key: zeroedKey ? undefined : filter.blockHash };
                    yield { ...filter, filterParams };
                    if (progressCooldown())
                        onProgressInfo?.({
                            stage: 'block',
                            progress: { from, to, current: filter.blockHeight },
                        });
                }
                onProgressInfo?.({
                    stage: 'block',
                    activity: 'fetch',
                    batchFrom: last.blockHeight,
                    progress: { from, to, current: last.blockHeight },
                });

                batch = await nextBatchPromise;
            } while (batch.response.status === 'ok');
        }

        // If filters couldn't be fetched (either due to reorg in forward phase
        // or not old enough checkpoint in backward phase), throw error
        if (batch.response.status === 'not-found') {
            throw new Error(`Block not found: ${batch.hash}`);
        }

        // Here, batch.response.status is always up-to-date
    }
}
