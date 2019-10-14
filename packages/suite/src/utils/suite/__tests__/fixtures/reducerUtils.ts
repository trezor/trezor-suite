export const observeChanges = [
    {
        testName: 'observeChanges',
        prev: {
            a: 1,
            b: 2,
            c: 3,
        },
        current: {
            a: 1,
            b: 2,
            c: 5,
        },
        filter: undefined,
        result: true,
    },
    {
        testName: 'observeChanges no change',
        prev: {
            a: 1,
            b: 2,
            c: 3,
        },
        current: {
            a: 1,
            b: 2,
            c: 3,
        },
        filter: undefined,
        result: false,
    },
    {
        testName: 'observeChanges deep change with filter',
        prev: {
            a: 1,
            b: 2,
            c: {
                c1: 1,
                c2: 2,
            },
        },
        current: {
            a: 1,
            b: 2,
            c: {
                c1: 1,
                c2: 4,
            },
        },
        filter: { c: ['c2'] },
        result: true,
    },
    {
        testName: 'observeChanges deep change without filter',
        prev: {
            a: 1,
            b: 2,
            c: {
                c1: 1,
                c2: 2,
            },
        },
        current: {
            a: 1,
            b: 2,
            c: {
                c1: 1,
                c2: 4,
            },
        },
        filter: undefined,
        result: true,
    },
    {
        testName: 'observeChanges deep change with filter on wrong field',
        prev: {
            a: 1,
            b: 2,
            c: {
                c1: 1,
                c2: 2,
            },
        },
        current: {
            a: 1,
            b: 2,
            c: {
                c1: 1,
                c2: 4,
            },
        },
        filter: { c: ['c1'] },
        result: false,
    },
    {
        testName: 'observeChanges array no change',
        prev: [1],
        current: [1],
        filter: undefined,
        result: false,
    },
    {
        testName: 'observeChanges array with changed length',
        prev: [],
        current: [1],
        filter: undefined,
        result: true,
    },
    {
        testName: 'observeChanges array with changed value',
        prev: [0],
        current: [1],
        filter: undefined,
        result: true,
    },
    {
        testName: 'observeChanges different types',
        prev: 1,
        current: [1],
        filter: undefined,
        result: true,
    },
    {
        testName: 'observeChanges object keys different lengths',
        prev: { key1: 1 },
        current: { key1: 1, key2: 2 },
        filter: undefined,
        result: true,
    },
    {
        testName: 'observeChanges object keys same lengths but different keys',
        prev: { key1: 1 },
        current: { key2: 2 },
        filter: undefined,
        result: true,
    },
    {
        testName: 'observeChanges different strings',
        prev: 'a',
        current: 'b',
        filter: undefined,
        result: true,
    },
    {
        testName: 'observeChanges same strings',
        prev: 'a',
        current: 'a',
        filter: undefined,
        result: false,
    },
    {
        testName: 'observeChanges different numbers',
        prev: 1,
        current: 2,
        filter: undefined,
        result: true,
    },
    {
        testName: 'observeChanges same numbers',
        prev: 1,
        current: 1,
        filter: undefined,
        result: false,
    },
];
