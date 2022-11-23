import { FILTERS_BATCH_SIZE, PROGRESS_BATCH_SIZE_MIN, PROGRESS_BATCH_SIZE_MAX } from '../constants';
import type {
    FilterClient,
    FilterController,
    FilterControllerParams,
    FilterControllerContext,
} from '../types/backend';
import type { CoinjoinBackendSettings } from '../types';

export class CoinjoinFilterController implements FilterController {
    private readonly client;
    private readonly baseBlock;

    constructor(client: FilterClient, { baseBlockHash, baseBlockHeight }: CoinjoinBackendSettings) {
        this.client = client;
        this.baseBlock = {
            blockHash: baseBlockHash,
            blockHeight: baseBlockHeight,
        };
    }

    /**
     * Returns number of blocks which must be scanned to change the discovery progress by 1 %,
     * clamped by PROGRESS_BATCH_SIZE_MIN (so progress is not signalled too often)
     * and PROGRESS_BATCH_SIZE_MAX (so there isn't too big gap between two progress signallings)
     */
    private getProgressBatchSize(firstBlock: number, bestBlock: number) {
        const percent = Math.ceil((bestBlock - firstBlock) / 100);
        return Math.min(Math.max(percent, PROGRESS_BATCH_SIZE_MIN), PROGRESS_BATCH_SIZE_MAX);
    }

    async *getFilterIterator(params?: FilterControllerParams, context?: FilterControllerContext) {
        const filterBatchSize = params?.batchSize ?? FILTERS_BATCH_SIZE;

        let counter = 0;
        let filterBatch = await this.client.fetchFilters(
            (params?.checkpoints?.[0] ?? this.baseBlock).blockHash,
            filterBatchSize,
            { signal: context?.abortSignal },
        );

        const firstBlockHeight =
            filterBatch.status === 'ok' ? filterBatch.filters[0]?.blockHeight : -1;

        while (filterBatch.status === 'ok') {
            const { bestHeight, filters } = filterBatch;
            const progressBatchSize = this.getProgressBatchSize(firstBlockHeight, bestHeight);
            for (let i = 0; i < filters.length; ++i) {
                const filter = filters[i];
                let progress;
                if (++counter >= progressBatchSize) {
                    counter = 0;
                    progress =
                        (filter.blockHeight - firstBlockHeight) / (bestHeight - firstBlockHeight);
                }
                yield {
                    ...filter,
                    progress,
                };
            }
            // eslint-disable-next-line no-await-in-loop
            filterBatch = await this.client.fetchFilters(
                filters[filters.length - 1].blockHash,
                filterBatchSize,
                { signal: context?.abortSignal },
            );
        }

        if (filterBatch.status === 'not-found') {
            throw new Error('Block not found');
        }
    }
}
