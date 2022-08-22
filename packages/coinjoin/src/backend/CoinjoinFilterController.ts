import { FILTERS_BATCH_SIZE } from '../constants';
import type {
    FilterClient,
    FilterController,
    FilterControllerParams,
    FilterControllerContext,
} from '../types/backend';
import type { CoinjoinBackendSettings } from '../types';

export class CoinjoinFilterController implements FilterController {
    private readonly client;
    private readonly baseBlockHash;

    private bestHeight: number;
    get bestBlockHeight() {
        return this.bestHeight;
    }

    constructor(client: FilterClient, { baseBlockHash }: CoinjoinBackendSettings) {
        this.client = client;
        this.baseBlockHash = baseBlockHash;
        this.bestHeight = -1;
    }

    async *getFilterIterator(params?: FilterControllerParams, context?: FilterControllerContext) {
        const batchSize = params?.batchSize ?? FILTERS_BATCH_SIZE;
        let knownBlockHash = params?.fromHash ?? this.baseBlockHash;
        while (knownBlockHash) {
            // eslint-disable-next-line no-await-in-loop
            const { bestHeight, filters } = await this.client.fetchFilters(
                knownBlockHash,
                batchSize,
                { signal: context?.abortSignal },
            );
            this.bestHeight = bestHeight;
            for (let i = 0; i < filters.length; ++i) {
                yield filters[i];
            }
            knownBlockHash = filters[filters.length - 1]?.blockHash;
        }
    }
}
