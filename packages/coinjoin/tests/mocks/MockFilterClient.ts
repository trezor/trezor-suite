import type { BlockFilter, FilterClient } from '../../src/types/backend';

export class MockFilterClient implements FilterClient {
    private bestHeight;
    private readonly filters;

    constructor(filters: BlockFilter[]) {
        this.filters = filters;
        this.bestHeight = this.filters[this.filters.length - 1].blockHeight;
    }

    fetchFilters(knownHash: string, count: number) {
        const from = this.filters.findIndex(f => f.prevHash === knownHash);
        return Promise.resolve({
            bestHeight: this.bestHeight,
            filters: from < 0 ? [] : this.filters.slice(from, from + count),
        });
    }
}
