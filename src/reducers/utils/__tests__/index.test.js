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
                pervious: { one: 1 },
                current: { one: 1 },
            },
            {
                pervious: { one: { two: 1 } },
                current: { one: { two: 1 } },
            },
            {
                pervious: { one: { two: [1, 2, 3] } },
                current: { one: { two: [1, 2, 3] } },
            },
            {
                pervious: { one: { two: [1, { three: 1 }, 3] } },
                current: { one: { two: [1, { three: 1 }, 3] } },
            },
            {
                pervious: { one: { two: [1, { three: 1 }, { four: 3, five: { six: 3 } }] } },
                current: { one: { two: [1, { three: 1 }, { four: 3, five: { six: 3 } }] } },
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
                pervious: { one: 1 },
                current: {},
            },
            {
                pervious: { one: 1 },
                current: { one: 1, two: 2 },
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
                pervious: { one: 1 },
                current: { one: 2 },
            },
            {
                pervious: { one: { two: 1 } },
                current: { one: { two: 2 } },
            },
            {
                pervious: { one: { two: 1 } },
                current: { one: { two: 2 } },
            },
            {
                pervious: { one: { two: [1, 2, 3] } },
                current: { one: { two: [1, 1, 3] } },
            },
            {
                pervious: { one: { two: [1, { three: 1 }, 3] } },
                current: { one: { two: [1, { three: 2 }, 3] } },
            },
            {
                pervious: { one: { two: [1, { three: 1 }, { four: 3, five: { six: 3 } }] } },
                current: { one: { two: [1, { three: 1 }, { four: 3, five: { six: 1 } }] } },
            },
            {
                pervious: { one: { two: [1, { three: 1 }, { four: 3, five: { sixxx: 3 } }] } },
                current: { one: { two: [1, { three: 1 }, { four: 3, five: { six: 1 } }] } },
            },
        ];

        data.forEach((item) => {
            expect(reducerUtils.observeChanges(
                item.pervious, item.current,
            )).toMatchSnapshot();
        });
    });
});
