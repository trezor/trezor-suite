import { WabiSabiStorage } from '../../../src/workers/wabisabi/storage';
import type { BlockFilter } from '../../../src/workers/wabisabi/types';

/**
 * example: 3 => {
 *  blockHeight: 3,
 *  blockHash: '333',
 *  blockTime: 30,
 *  filter: '33333',
 *  prevHash: '222'
 * }
 */
const mockFilter = (height: number): BlockFilter => ({
    blockHeight: height,
    blockHash: height.toString().repeat(3),
    blockTime: height * 10,
    filter: height.toString().repeat(5),
    prevHash: (height - 1).toString().repeat(3),
});

describe('WabiSabiStorage', () => {
    let storage: WabiSabiStorage;

    beforeEach(() => {
        storage = new WabiSabiStorage(':memory:');
    });

    afterEach(() => {
        storage.dispose();
    });

    it('isConsistent', () => {
        expect(storage.isConsistent(2, '222')).toBe(true);
        storage.loadBlockFilters([3, 4, 5].map(mockFilter));
        expect(storage.isConsistent(2, '222')).toBe(true);
        expect(storage.isConsistent(1, '111')).toBe(false);
        storage.loadBlockFilters([7].map(mockFilter));
        expect(storage.isConsistent(2, '222')).toBe(false);
    });

    it('(load|peek)BlockFilters', () => {
        expect(storage.peekBlockFilter()).toBe(undefined);
        expect(() => storage.loadBlockFilters([3, 4, 5].map(mockFilter))).not.toThrow();
        expect(storage.peekBlockFilter()?.blockHeight).toBe(5);
        expect(() => storage.loadBlockFilters([6, 5].map(mockFilter))).toThrow(); // PRIMARY KEY violation
        expect(storage.peekBlockFilter()?.blockHeight).toBe(5);
        expect(() => storage.loadBlockFilters([7, 8].map(mockFilter))).not.toThrow(); // ignoring broken sequence
        expect(storage.peekBlockFilter()?.blockHeight).toBe(8);
        expect(() => storage.loadBlockFilters([{ ...mockFilter(9), blockHash: '888' }])).toThrow(); // UNIQUE violation
    });

    it('getBlockFilterIterator', () => {
        const mockFilters = [5, 6, 7, 8].map(mockFilter);
        storage.loadBlockFilters(mockFilters);
        const iterator = storage.getBlockFilterIterator();
        let index = 0;
        // eslint-disable-next-line no-restricted-syntax
        for (const filter of iterator()) {
            expect(filter).toEqual(mockFilters[index++]);
        }
    });
});
