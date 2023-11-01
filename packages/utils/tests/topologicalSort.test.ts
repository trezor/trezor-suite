import { topologicalSort } from '../src/topologicalSort';

type Fixture<T> = {
    description: string;
    inputs: T[][];
    output?: T[];
    precedes: (from: T, to: T) => boolean;
    tie?: (a: T, to: T) => number;
};

const FIXTURES: Fixture<any>[] = [
    {
        description: 'basic sorting with stable ties',
        inputs: [
            ['a', 'b', 'c', 'd', 'e'],
            ['c', 'a', 'd', 'b', 'e'],
            ['c', 'a', 'e', 'd', 'b'],
        ],
        output: ['c', 'e', 'b', 'a', 'd'],
        precedes: (from: string, to: string) =>
            ({ b: ['a', 'd'], e: ['b'] })[from]?.includes(to) ?? false,
    },
    {
        description: 'basic sorting with alphabetical ties',
        inputs: [
            ['a', 'b', 'e', 'd', 'c'],
            ['c', 'd', 'a', 'b', 'e'],
            ['e', 'd', 'c', 'a', 'b'],
        ],
        output: ['c', 'e', 'b', 'a', 'd'],
        precedes: (from: string, to: string) =>
            ({ b: ['a', 'd'], e: ['b'] })[from]?.includes(to) ?? false,
        tie: (a: string, b: string) => a.localeCompare(b),
    },
    {
        description: 'no precedence with stable ties',
        inputs: [['a', 'c', 'e', 'd', 'b']],
        output: ['a', 'c', 'e', 'd', 'b'],
        precedes: () => false,
    },
    {
        description: 'with duplicities',
        inputs: [
            ['a', 'b', 'c', 'a'],
            ['c', 'b', 'a', 'a'],
            ['a', 'c', 'a', 'b'],
        ],
        output: ['b', 'a', 'a', 'c'],
        precedes: (from: string, to: string) =>
            ({ b: ['a'], a: ['c'] })[from]?.includes(to) ?? false,
    },
    {
        description: 'cyclic error',
        inputs: [[21, 42]],
        precedes: () => true,
    },
    {
        description: 'objects',
        inputs: [
            [
                { id: 1, name: 'alpha' },
                { id: 2, name: 'beta' },
                { id: 3, name: 'gamma' },
                { id: 4, name: 'delta' },
            ],
        ],
        output: [
            { id: 4, name: 'delta' },
            { id: 3, name: 'gamma' },
            { id: 1, name: 'alpha' },
            { id: 2, name: 'beta' },
        ],
        precedes: (from: { id: number }, to: { id: number }) => from.id === 4 && to.id <= 2,
        tie: (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name),
    },
];

describe('topologicalSort', () => {
    FIXTURES.forEach(({ description, inputs, output, precedes, tie }) => {
        describe(description, () => {
            inputs.forEach(input => {
                it(JSON.stringify(input), () => {
                    const tst = () => topologicalSort(input, precedes, tie);
                    if (!output) expect(tst).toThrow();
                    else expect(tst()).toEqual(output);
                });
            });
        });
    });
});
