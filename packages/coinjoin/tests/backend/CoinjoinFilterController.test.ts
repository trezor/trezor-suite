import { CoinjoinFilterController as NodeController } from '../../src/backend/CoinjoinFilterController';
import { CoinjoinFilterController as BrowserController } from '../../src/backend/CoinjoinFilterController.browser';
import { BlockFilter, FilterClient } from '../../src/backend/types';
import { mockFilterSequence } from '../fixtures/filters.fixture';
import { LOCALHOST_REGTEST_SETTINGS } from '../../src/constants';
import { MockFilterClient } from '../mocks/MockFilterClient';

const FILTER_COUNT = 16;
const FILTER_MIDDLE = 8;

const FILTERS: BlockFilter[] = mockFilterSequence(
    FILTER_COUNT,
    LOCALHOST_REGTEST_SETTINGS.baseBlockHeight,
    LOCALHOST_REGTEST_SETTINGS.baseBlockHash,
);

const BEST_HEIGHT = FILTER_COUNT + LOCALHOST_REGTEST_SETTINGS.baseBlockHeight;

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
            fromHash: FILTERS[FILTER_MIDDLE].prevHash,
        },
        expected: FILTERS.slice(FILTER_MIDDLE),
    },
    {
        description: 'Not found',
        params: {
            batchSize: 5,
            fromHash: 'foo',
        },
        expected: [],
    },
];

describe('CoinjoinFilterController', () => {
    let client: FilterClient;

    beforeEach(() => {
        client = new MockFilterClient(FILTERS);
    });

    describe('Node controller', () => {
        FIXTURES.forEach(({ description, params, expected }) => {
            it(description, async () => {
                const controller = new NodeController(client, LOCALHOST_REGTEST_SETTINGS);
                const iterator = controller.getFilterIterator(params);
                const received = [];
                // eslint-disable-next-line no-restricted-syntax
                for await (const b of iterator) {
                    expect(controller.bestBlockHeight).toBe(BEST_HEIGHT);
                    received.push(b);
                }
                expect(received).toEqual(expected);
            });
        });
    });

    describe('Browser controller', () => {
        FIXTURES.forEach(({ description, params, expected }) => {
            it(description, async () => {
                const controller = new BrowserController(client, LOCALHOST_REGTEST_SETTINGS);
                const iterator = controller.getFilterIterator(params);
                const received = [];
                // eslint-disable-next-line no-restricted-syntax
                for await (const b of iterator) {
                    expect(controller.bestBlockHeight).toBe(BEST_HEIGHT);
                    received.push(b);
                }
                expect(received).toEqual(expected);
            });
        });
    });
});
