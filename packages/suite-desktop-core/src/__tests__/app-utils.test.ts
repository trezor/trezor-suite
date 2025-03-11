import { processStatePatch } from '../libs/app-utils';

const fullState = 'state={ "d": { "e": true, "f": null }, "a.c": "baz" }';
const partialState1 = 'state=a={"b": [5] }';
const partialState2 = 'state=a.b=[1, 3, 8]';
const singleProperty = 'state=a.c=foobar';
const notInState = 'a=nothing';
const notAssignment = 'hasNoEqualitySign';

const FIXTURES: [string, string[], any][] = [
    ['none', [], undefined],
    ['simple', [partialState2, singleProperty], { a: { b: [1, 3, 8], c: 'foobar' } }],
    ['mixed', [notInState, partialState1, notInState, partialState2], { a: { b: [5, 1, 3, 8] } }],
    [
        'complex',
        [partialState2, notInState, fullState, notAssignment, partialState1, singleProperty],
        { a: { b: [1, 3, 8, 5], c: 'foobar' }, d: { e: true, f: null } },
    ],
    ['invalid', [notAssignment, notInState], undefined],
];

describe('process state patch', () => {
    FIXTURES.map(([name, args, value]) => {
        it(name, () => {
            process.argv = args.map(arg => `--${arg}`);
            expect(processStatePatch()).toStrictEqual(value);
        });
    });
});
