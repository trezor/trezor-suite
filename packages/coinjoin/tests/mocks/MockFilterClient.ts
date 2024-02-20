import type { FilterClient } from '../../src/types/backend';
import type { MockBlockFilter } from '../fixtures/filters.fixture';

export class MockFilterClient implements FilterClient {
    private filters: MockBlockFilter[] = [];

    setFixture(filters: MockBlockFilter[]) {
        this.filters = filters;
    }

    fetchNetworkInfo(): ReturnType<FilterClient['fetchNetworkInfo']> {
        const tip = this.filters[this.filters.length - 1];

        return Promise.resolve({ bestHeight: tip.blockHeight } as any);
    }

    fetchBlockFilters(
        knownHash: string,
        count: number,
    ): ReturnType<FilterClient['fetchBlockFilters']> {
        const tip = this.filters[this.filters.length - 1];
        if (knownHash === tip.blockHash) {
            return Promise.resolve({ status: 'up-to-date' });
        }
        const from = this.filters.findIndex(f => f.prevHash === knownHash);

        return from < 0
            ? Promise.resolve({ status: 'not-found' })
            : Promise.resolve({
                  status: 'ok',
                  filters: this.filters.slice(from, from + count),
              });
    }
}
