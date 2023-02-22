import { PROGRESS_BATCH_SIZE_MIN, PROGRESS_BATCH_SIZE_MAX } from '../constants';
import type {
    FilterClient,
    FilterController,
    FilterControllerParams,
    FilterControllerContext,
} from '../types/backend';
import type { CoinjoinBackendSettings } from '../types';

export class CoinjoinFilterController implements FilterController {
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

    /**
     * Returns function which calculates progress for given block height and returns it whenever it changes by 1 %
     * (clamped by PROGRESS_BATCH_SIZE_MIN so progress is not signalled too often and PROGRESS_BATCH_SIZE_MAX so
     * there isn't too big gap between two progress signallings), or undefined when the change is smaller.
     * First block progress is always signalled (required for handling reorgs properly)
     */
    private getProgressHandler(baseHeight: number, bestHeight: number) {
        const blockCount = bestHeight - baseHeight;
        const percent = Math.ceil(blockCount / 100);
        const batch = Math.min(Math.max(percent, PROGRESS_BATCH_SIZE_MIN), PROGRESS_BATCH_SIZE_MAX);
        return (height: number) => {
            const count = height - baseHeight;
            return count % batch === 1 ? count / blockCount : undefined;
        };
    }

    async *getFilterIterator(params: FilterControllerParams, context?: FilterControllerContext) {
        const [latestCheckpoint, ...olderCheckpoints] = params?.checkpoints?.length
            ? params.checkpoints
            : [this.baseBlock];

        const fetchFilterBatch = async ({ blockHeight, blockHash }: typeof latestCheckpoint) => ({
            height: blockHeight,
            hash: blockHash,
            response: await this.client.fetchFilters(
                blockHash,
                params?.batchSize ?? this.batchSize,
                { signal: context?.abortSignal },
            ),
        });

        // Try to fetch filters from the latest checkpoint
        let batch = await fetchFilterBatch(latestCheckpoint);

        // Backward phase:
        // Try to rollback through the older checkpoints as long as 'not-found' (handles reorgs)
        // eslint-disable-next-line no-restricted-syntax
        for (const checkpoint of olderCheckpoints) {
            if (batch.response.status !== 'not-found') break;
            // eslint-disable-next-line no-await-in-loop
            batch = await fetchFilterBatch(checkpoint);
        }

        // Forward phase:
        // If there are filters, iterate over them and fetch subsequent batch
        if (batch.response.status === 'ok') {
            const getProgress = this.getProgressHandler(batch.height, batch.response.bestHeight);
            do {
                const { filters } = batch.response;
                const nextBatchPromise = fetchFilterBatch(filters[filters.length - 1]);
                // eslint-disable-next-line no-restricted-syntax
                for (const filter of filters) {
                    yield { ...filter, progress: getProgress(filter.blockHeight) };
                }
                // eslint-disable-next-line no-await-in-loop
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
