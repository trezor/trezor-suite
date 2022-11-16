import type { BlockFilter, FilterClient } from '../../src/types/backend';

export class MockFilterClient implements FilterClient {
    private readonly filters;

    constructor(filters: BlockFilter[]) {
        this.filters = filters;
    }

    fetchFilters(knownHash: string, count: number): ReturnType<FilterClient['fetchFilters']> {
        const tip = this.filters[this.filters.length - 1];
        if (knownHash === tip.blockHash) {
            return Promise.resolve({ status: 'up-to-date' });
        }
        const from = this.filters.findIndex(f => f.prevHash === knownHash);
        return from < 0
            ? Promise.resolve({ status: 'not-found' })
            : Promise.resolve({
                  status: 'ok',
                  bestHeight: tip.blockHeight,
                  filters: this.filters.slice(from, from + count),
              });
    }
}
