import { processStatePatch } from '../libs/app-utils';

const ARGS = {
    state: '{ "d": { "e": true }, "a.c": "baz" }',
    'state.a': '{"b": [5] }',
    'state.a.b': '[1, 3, 8]',
    'state.a.c': 'foobar',
    a: 'nothing',
    b: 'empty',
};

const FIXTURES: [string, (keyof typeof ARGS)[], any][] = [
    ['simple', ['state.a.b', 'state.a.c'], { a: { b: [1, 3, 8], c: 'foobar' } }],
    ['mixed', ['a', 'state.a', 'b', 'state.a.b'], { a: { b: [5, 1, 3, 8] } }],
    [
        'complex',
        ['state.a.b', 'a', 'state', 'b', 'state.a'],
        { a: { b: [1, 3, 8, 5], c: 'baz' }, d: { e: true } },
    ],
];

jest.mock('electron', () => {
    return {
        app: {
            commandLine: {
                getSwitchValue: (arg: keyof typeof ARGS) => ARGS[arg],
            },
        },
    };
});

describe('process state patch', () => {
    FIXTURES.map(([name, args, value]) => {
        it(name, () => {
            process.argv = args.map(arg => `--${arg}=${ARGS[arg]}`);
            expect(processStatePatch()).toStrictEqual(value);
        });
    });
});
