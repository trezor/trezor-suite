import { CoinjoinStorage } from './CoinjoinStorage';
import { FILTERS_BATCH_SIZE } from '../constants';
import type {
    FilterClient,
    FilterController,
    FilterControllerParams,
    FilterControllerContext,
} from './types';
import type { CoinjoinBackendSettings } from '../types';

export class CoinjoinFilterController implements FilterController {
    private readonly client;
    private readonly storage;
    private readonly baseBlockHeight;
    private readonly baseBlockHash;

    private bestHeight: number;
    get bestBlockHeight() {
        return this.bestHeight;
    }

    constructor(client: FilterClient, settings: CoinjoinBackendSettings) {
        this.client = client;
        this.storage = new CoinjoinStorage(settings.storagePath);
        this.baseBlockHeight = settings.baseBlockHeight;
        this.baseBlockHash = settings.baseBlockHash;
        this.bestHeight = this.storage.peekBlockFilter()?.blockHeight ?? -1;
    }

    private checkConsistency() {
        // Check whether DB data are consistent
        if (!this.storage.isConsistent(this.baseBlockHeight, this.baseBlockHash)) {
            throw new Error('Storage inconsistent');
        }
    }

    async *getFilterIterator(params?: FilterControllerParams, context?: FilterControllerContext) {
        this.checkConsistency();

        // TODO this is redudant call only to know the bestHeight beforehand
        const { bestHeight } = await this.client.fetchFilters(this.baseBlockHash, 1, {
            signal: context?.abortSignal,
        });
        this.bestHeight = bestHeight;

        const batchSize = params?.batchSize ?? FILTERS_BATCH_SIZE;
        let knownBlockHash = params?.fromHash ?? this.baseBlockHash;

        const iterator = this.storage.getBlockFilterIterator();
        // eslint-disable-next-line no-restricted-syntax
        for (const filter of iterator()) yield filter;

        knownBlockHash = this.storage.peekBlockFilter()?.blockHash ?? knownBlockHash;
        while (knownBlockHash) {
            // eslint-disable-next-line no-await-in-loop
            const { bestHeight, filters } = await this.client.fetchFilters(
                knownBlockHash,
                batchSize,
                { signal: context?.abortSignal },
            );
            this.bestHeight = bestHeight;
            this.storage.loadBlockFilters(filters);
            for (let i = 0; i < filters.length; ++i) {
                yield filters[i];
            }
            knownBlockHash = filters[filters.length - 1]?.blockHash;
        }
    }
}
