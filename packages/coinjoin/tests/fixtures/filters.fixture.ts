import { BlockFilter } from '../../src/types/backend';

/**
 * example: 3 => {
 *  blockHeight: 3,
 *  blockTime: 30,
 *  blockHash: 'hash_3',
 *  prevHash: 'hash_2'
 *  filter: 'filter_3',
 * }
 */
export const mockFilter = (height: number): BlockFilter => ({
    blockHeight: height,
    blockTime: height * 10,
    blockHash: `hash_${height}`,
    prevHash: `hash_${height - 1}`,
    filter: `filter_${height}`,
});

export const mockFilterSequence = (
    count: number,
    baseHeight = 0,
    baseHash = 'hash_0',
): BlockFilter[] => {
    const filters: BlockFilter[] = [];
    for (let i = 0; i < count; ++i) {
        filters.push({
            ...mockFilter(baseHeight + i + 1),
            prevHash: filters[i - 1]?.blockHash ?? baseHash,
        });
    }
    return filters;
};
