import * as reducerUtils from '../index';

describe('reducers utils', () => {
    it('observeChanges shoud be the same - returns false', () => {
        const data = [
            // example of same data (false)
            {
                previous: {},
                current: {},
            },
            {
                previous: 1,
                current: 1,
            },
            {
                previous: [],
                current: [],
            },
            {
                previous: [1, 1, 1],
                current: [1, 1, 1],
            },
            {
                previous: 'a',
                current: 'a',
            },
            {
                previous: { one: 1 },
                current: { one: 1 },
            },
            {
                previous: { one: { two: 1 } },
                current: { one: { two: 1 } },
            },
            {
                previous: { one: { two: [1, 2, 3] } },
                current: { one: { two: [1, 2, 3] } },
            },
            {
                previous: { one: { two: [1, { three: 1 }, 3] } },
                current: { one: { two: [1, { three: 1 }, 3] } },
            },
            {
                previous: { one: { two: [1, { three: 1 }, { four: 3, five: { six: 3 } }] } },
                current: { one: { two: [1, { three: 1 }, { four: 3, five: { six: 3 } }] } },
            },
        ];

        data.forEach((item) => {
            expect(reducerUtils.observeChanges(
                item.previous, item.current,
            )).toMatchSnapshot();
        });
    });

    it('observeChanges shoul NOT be the same - returns true', () => {
        const data = [
            // example of different data (true)
            {
                previous: null,
                current: {},
            },
            {
                previous: { one: 1 },
                current: {},
            },
            {
                previous: { one: 1, three: 3 },
                current: { one: 1, two: 2 },
            },
            {
                previous: [{}, {}],
                current: [],
            },
            {
                previous: [1, 1, 1],
                current: [1, 1],
            },
            {
                previous: 'a',
                current: 'b',
            },
            {
                previous: ['a'],
                current: ['b'],
            },
            {
                previous: 1,
                current: '1',
            },
            {
                previous: { one: 1 },
                current: { one: 2 },
            },
            {
                previous: { one: { two: 1 } },
                current: { one: { two: 2 } },
            },
            {
                previous: { one: { two: 1 } },
                current: { one: { two: 2 } },
            },
            {
                previous: { one: { two: [1, 2, 3] } },
                current: { one: { two: [1, 1, 3] } },
            },
            {
                previous: { one: { two: [1, { three: 1 }, 3] } },
                current: { one: { two: [1, { three: 2 }, 3] } },
            },
            {
                previous: { one: { two: [1, { three: 1 }, { four: 3, five: { six: 3 } }] } },
                current: { one: { two: [1, { three: 1 }, { four: 3, five: { six: 1 } }] } },
            },
            {
                previous: { one: { two: [1, { three: 1 }, { four: 3, five: { sixxx: 3 } }] } },
                current: { one: { two: [1, { three: 1 }, { four: 3, five: { six: 1 } }] } },
            },
        ];

        data.forEach((item) => {
            expect(reducerUtils.observeChanges(
                item.previous, item.current,
            )).toMatchSnapshot();
        });
    });

    it('observeChanges test filter', () => {
        const data = [
            {
                previous: { one: { two: 2, three: 3 } },
                current: { one: { two: 2, three: 4 } },
                filter: { one: ['two'] },
            },
            {
                previous: { one: { two: 2, three: 3 } },
                current: { one: { two: 1, three: 3 } },
                filter: { one: ['two'] },
            },
        ];

        data.forEach((item) => {
            expect(reducerUtils.observeChanges(
                item.previous, item.current, item.filter,
            )).toMatchSnapshot();
        });
    });
});
