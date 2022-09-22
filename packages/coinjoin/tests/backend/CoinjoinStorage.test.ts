import { CoinjoinStorage } from '../../src/backend/CoinjoinStorage';
import { mockFilter } from '../fixtures/filters.fixture';

describe('CoinjoinStorage', () => {
    let storage: CoinjoinStorage;

    beforeEach(() => {
        storage = new CoinjoinStorage(':memory:');
    });

    afterEach(() => {
        storage.dispose();
    });

    it('isConsistent', () => {
        expect(storage.isConsistent(2, 'hash_2')).toBe(true);
        storage.loadBlockFilters([3, 4, 5].map(mockFilter));
        expect(storage.isConsistent(2, 'hash_2')).toBe(true);
        expect(storage.isConsistent(1, 'hash_1')).toBe(false);
        storage.loadBlockFilters([7].map(mockFilter));
        expect(storage.isConsistent(2, 'hash_2')).toBe(false);
    });

    it('(load|peek)BlockFilters', () => {
        expect(storage.peekBlockFilter()).toBe(undefined);
        expect(() => storage.loadBlockFilters([3, 4, 5].map(mockFilter))).not.toThrow();
        expect(storage.peekBlockFilter()?.blockHeight).toBe(5);
        expect(() => storage.loadBlockFilters([6, 5].map(mockFilter))).toThrow(); // PRIMARY KEY violation
        expect(storage.peekBlockFilter()?.blockHeight).toBe(5);
        expect(() => storage.loadBlockFilters([7, 8].map(mockFilter))).not.toThrow(); // ignoring broken sequence
        expect(storage.peekBlockFilter()?.blockHeight).toBe(8);
        expect(() =>
            storage.loadBlockFilters([{ ...mockFilter(9), blockHash: 'hash_8' }]),
        ).toThrow(); // UNIQUE violation
    });

    describe('getBlockFilterIterator', () => {
        it('From start', () => {
            const mockFilters = [5, 6, 7, 8].map(mockFilter);
            storage.loadBlockFilters(mockFilters);
            const iterator = storage.getBlockFilterIterator();
            let index = 0;
            // eslint-disable-next-line no-restricted-syntax
            for (const filter of iterator()) {
                expect(filter).toEqual(mockFilters[index++]);
            }
        });

        it('From middle', () => {
            const mockFilters = [5, 6, 7, 8].map(mockFilter);
            storage.loadBlockFilters(mockFilters);
            let index = 2;
            const iterator = storage.getBlockFilterIterator(mockFilters[index].prevHash);
            // eslint-disable-next-line no-restricted-syntax
            for (const filter of iterator()) {
                expect(filter).toEqual(mockFilters[index++]);
            }
        });
    });
});
