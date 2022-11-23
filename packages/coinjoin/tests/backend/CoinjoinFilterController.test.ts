import { CoinjoinFilterController } from '../../src/backend/CoinjoinFilterController';
import { BlockFilter, FilterClient } from '../../src/types/backend';
import { mockFilterSequence } from '../fixtures/filters.fixture';
import { COINJOIN_BACKEND_SETTINGS } from '../fixtures/config.fixture';
import { MockFilterClient } from '../mocks/MockFilterClient';

const FILTER_COUNT = 16;
const FILTER_MIDDLE = 8;

const FILTERS: BlockFilter[] = mockFilterSequence(
    FILTER_COUNT,
    COINJOIN_BACKEND_SETTINGS.baseBlockHeight,
    COINJOIN_BACKEND_SETTINGS.baseBlockHash,
);

const FIXTURES = [
    {
        description: 'From start',
        params: {
            batchSize: 5,
        },
        expected: FILTERS,
    },
    {
        description: 'From middle',
        params: {
            batchSize: 5,
            checkpoints: [
                {
                    blockHash: FILTERS[FILTER_MIDDLE - 1].blockHash,
                    blockHeight: FILTERS[FILTER_MIDDLE - 1].blockHeight,
                },
            ],
        },
        expected: FILTERS.slice(FILTER_MIDDLE),
    },
    {
        description: 'Not found',
        params: {
            batchSize: 5,
            checkpoints: [
                {
                    blockHash: 'foo',
                    blockHeight: 42,
                },
            ],
        },
        error: 'not found',
    },
];

describe('CoinjoinFilterController', () => {
    let client: FilterClient;

    beforeEach(() => {
        client = new MockFilterClient(FILTERS);
    });

    describe('Filter controller', () => {
        FIXTURES.forEach(({ description, params, expected, error }) => {
            it(description, async () => {
                const controller = new CoinjoinFilterController(client, COINJOIN_BACKEND_SETTINGS);
                const iterator = controller.getFilterIterator(params);
                if (error) {
                    await expect(() => iterator.next()).rejects.toThrow(error);
                } else {
                    const received = [];
                    // eslint-disable-next-line no-restricted-syntax
                    for await (const { progress, ...b } of iterator) {
                        received.push(b);
                    }
                    expect(received).toEqual(expected);
                }
            });
        });
    });
});
