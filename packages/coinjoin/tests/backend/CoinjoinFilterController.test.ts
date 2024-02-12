import { CoinjoinFilterController } from '../../src/backend/CoinjoinFilterController';
import { MockBlockFilter, mockFilterSequence } from '../fixtures/filters.fixture';
import { COINJOIN_BACKEND_SETTINGS } from '../fixtures/config.fixture';
import { MockFilterClient } from '../mocks/MockFilterClient';

const FILTER_COUNT = 16;
const FILTER_MIDDLE = 8;

const FILTERS: MockBlockFilter[] = mockFilterSequence(
    FILTER_COUNT,
    COINJOIN_BACKEND_SETTINGS.baseBlockHeight,
    COINJOIN_BACKEND_SETTINGS.baseBlockHash,
);

const REORG_FILTER: MockBlockFilter = {
    blockHeight: 9,
    blockHash: 'nope',
    filter: 'nope',
    prevHash: FILTERS[FILTER_MIDDLE - 1].blockHash,
    filterParams: { key: 'nope' },
};

const REORG_FILTERS = FILTERS.slice(0, FILTER_MIDDLE).concat(REORG_FILTER);

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
    const client = new MockFilterClient();

    beforeEach(() => {
        client.setFixture(FILTERS);
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

                    for await (const b of iterator) {
                        received.push(b);
                    }
                    expect(received).toEqual(expected);
                }
            });
        });

        it('Reorg', async () => {
            const params = { batchSize: 5 };
            const controller = new CoinjoinFilterController(client, COINJOIN_BACKEND_SETTINGS);
            const received = [];

            client.setFixture(REORG_FILTERS);

            for await (const b of controller.getFilterIterator(params)) {
                received.push(b);
            }

            expect(received).toEqual(REORG_FILTERS);
            received.length = 0;

            client.setFixture(FILTERS);

            for await (const b of controller.getFilterIterator({
                ...params,
                checkpoints: [REORG_FILTER, FILTERS[5]],
            })) {
                received.push(b);
            }

            expect(received).toEqual(FILTERS.slice(6));
        });
    });
});
