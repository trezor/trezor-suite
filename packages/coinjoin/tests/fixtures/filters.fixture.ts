import { BlockFilter } from '../../src/types/backend';

export type MockBlockFilter = BlockFilter & {
    prevHash: string;
    filterParams: { key: string };
};

/**
 * example: 3 => {
 *  blockHeight: 3,
 *  blockTime: 30,
 *  blockHash: 'hash_3',
 *  prevHash: 'hash_2'
 *  filter: 'filter_3',
 * }
 */
export const mockFilter = (height: number): MockBlockFilter => ({
    blockHeight: height,
    blockHash: `hash_${height}`,
    prevHash: `hash_${height - 1}`,
    filter: `filter_${height}`,
    filterParams: { key: `hash_${height}` },
});

export const mockFilterSequence = (
    count: number,
    baseHeight = 0,
    baseHash = 'hash_0',
): MockBlockFilter[] => {
    const filters: MockBlockFilter[] = [];
    for (let i = 0; i < count; ++i) {
        filters.push({
            ...mockFilter(baseHeight + i + 1),
            prevHash: filters[i - 1]?.blockHash ?? baseHash,
        });
    }

    return filters;
};
