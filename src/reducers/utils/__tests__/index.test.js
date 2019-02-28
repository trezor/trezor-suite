import * as utils from '../index';

describe('reducers utils', () => {
    it('observer changes should BE THE SAME - return false', () => {
        expect(utils.observeChanges(
            {},
            {},
        )).toBe(false);

        expect(utils.observeChanges(
            [],
            [],
        )).toBe(false);

        expect(utils.observeChanges(
            [1, 1, 1],
            [1, 1, 1],
        )).toBe(false);

        expect(utils.observeChanges(
            'a',
            'a',
        )).toBe(false);

        expect(utils.observeChanges(
            { one: 1 },
            { one: 1 },
        )).toBe(false);

        expect(utils.observeChanges(
            { one: { two: 1 } },
            { one: { two: 1 } },
        )).toBe(false);

        expect(utils.observeChanges(
            { one: { two: [1, 2, 3] } },
            { one: { two: [1, 2, 3] } },
        )).toBe(false);

        expect(utils.observeChanges(
            { one: { two: [1, { three: 1 }, 3] } },
            { one: { two: [1, { three: 1 }, 3] } },
        )).toBe(false);

        expect(utils.observeChanges(
            { one: { two: [1, { three: 1 }, { four: 3, five: { six: 3 } }] } },
            { one: { two: [1, { three: 1 }, { four: 3, five: { six: 3 } }] } },
        )).toBe(false);
    });

    it('observer should NOT be the same - return true', () => {
        expect(utils.observeChanges(
            null,
            {},
        )).toBe(true);

        expect(utils.observeChanges(
            { one: 1 },
            {},
        )).toBe(true);

        expect(utils.observeChanges(
            { one: 1, three: 3 }, { one: 1, two: 2 },
        )).toBe(true);

        expect(utils.observeChanges(
            [{}, {}],
            [],
        )).toBe(true);

        expect(utils.observeChanges(
            [1, 1, 1],
            [1, 1],
        )).toBe(true);

        expect(utils.observeChanges(
            'a',
            'b',
        )).toBe(true);

        expect(utils.observeChanges(
            ['a'],
            ['b'],
        )).toBe(true);

        expect(utils.observeChanges(
            1,
            '1',
        )).toBe(true);

        expect(utils.observeChanges(
            { one: 1 },
            { one: 2 },
        )).toBe(true);

        expect(utils.observeChanges(
            { one: { two: 1 } },
            { one: { two: 2 } },
        )).toBe(true);

        expect(utils.observeChanges(
            { one: { two: [1, 2, 3] } },
            { one: { two: [1, 1, 3] } },
        )).toBe(true);

        expect(utils.observeChanges(
            { one: { two: [1, { three: 1 }, 3] } },
            { one: { two: [1, { three: 2 }, 3] } },
        )).toBe(true);

        expect(utils.observeChanges(
            { one: { two: [1, { three: 1 }, { four: 3, five: { six: 3 } }] } },
            { one: { two: [1, { three: 1 }, { four: 3, five: { six: 1 } }] } },
        )).toBe(true);

        expect(utils.observeChanges(
            { one: { two: [1, { three: 1 }, { four: 3, five: { sixxx: 3 } }] } },
            { one: { two: [1, { three: 1 }, { four: 3, five: { six: 1 } }] } },
        )).toBe(true);
    });

    it('observeChanges test filter', () => {
        expect(utils.observeChanges(
            { one: { two: 2, three: 3 } },
            { one: { two: 2, three: 4 } },
            { one: ['two'] },
        )).toBe(false);

        expect(utils.observeChanges(
            { one: { two: 2, three: 3 } },
            { one: { two: 1, three: 3 } },
            { one: ['two'] },
        )).toBe(true);
    });
});
