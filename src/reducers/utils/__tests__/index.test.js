import * as reducerUtils from '../index';

describe('reducers utils', () => {
    it('observeChanges shoud be the same - returns false', () => {
        const data = [
            // example of same data (false)
            {
                pervious: {},
                current: {},
            },
            {
                pervious: 1,
                current: 1,
            },
            {
                pervious: [],
                current: [],
            },
            {
                pervious: [1, 1, 1],
                current: [1, 1, 1],
            },
            {
                pervious: 'a',
                current: 'a',
            },
            {
                pervious: { test: 1 },
                current: { test: 1 },
            },
            {
                pervious: { test: { test: 1 } },
                current: { test: { test: 1 } },
            },
            {
                pervious: { test: { test: [1, 2, 3] } },
                current: { test: { test: [1, 2, 3] } },
            },
            {
                pervious: { test: { test: [1, { test: 1 }, 3] } },
                current: { test: { test: [1, { test: 1 }, 3] } },
            },
            {
                pervious: { test: { test: [1, { test: 1 }, { test: 3, test1: { test: 3 } }] } },
                current: { test: { test: [1, { test: 1 }, { test: 3, test1: { test: 3 } }] } },
            },
        ];

        data.forEach((item) => {
            expect(reducerUtils.observeChanges(
                item.pervious, item.current,
            )).toMatchSnapshot();
        });
    });

    it('observeChanges shoul NOT be the same - returns true', () => {
        const data = [
            // example of different data (true)
            {
                pervious: { test: 1 },
                current: {},
            },
            {
                pervious: [{}, {}],
                current: [],
            },
            {
                pervious: [1, 1, 1],
                current: [1, 1],
            },
            {
                pervious: 'a',
                current: 'b',
            },
            {
                pervious: 1,
                current: '1',
            },
            {
                pervious: { test: 1 },
                current: { test: 2 },
            },
            {
                pervious: { test: { test: 1 } },
                current: { test: { test: 2 } },
            },
            {
                pervious: { test: { test: [1, 2, 3] } },
                current: { test: { test: [1, 1, 3] } },
            },
            {
                pervious: { test: { test: [1, { test: 1 }, 3] } },
                current: { test: { test: [1, { test: 2 }, 3] } },
            },
            {
                pervious: { test: { test: [1, { test: 1 }, { test: 3, test1: { test: 3 } }] } },
                current: { test: { test: [1, { test: 1 }, { test: 3, test1: { test: 1 } }] } },
            },
        ];

        data.forEach((item) => {
            expect(reducerUtils.observeChanges(
                item.pervious, item.current,
            )).toMatchSnapshot();
        });
    });
});
