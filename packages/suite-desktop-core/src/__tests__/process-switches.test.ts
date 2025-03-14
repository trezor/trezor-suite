import { SuiteSwitch, getSwitchValue, hasSwitch } from '../libs/process-switches';

type Fixture = {
    it: string;
    query: SuiteSwitch;
    args?: string[];
    hasSwitchResult: boolean;
    getSwitchValueResult: string;
};

const BASE_ARGS = ['--open-devtools', '--tor', '--updater-url=https://example.com', '--log-file='];

const FIXTURES: Fixture[] = [
    {
        it: 'no process args available',
        query: 'tor',
        args: [],
        hasSwitchResult: false,
        getSwitchValueResult: '',
    },
    {
        it: 'queried switch not present',
        query: 'pre-release',
        args: [...BASE_ARGS, 'pre-rel'],
        hasSwitchResult: false,
        getSwitchValueResult: '',
    },
    {
        it: 'queried switch present without value',
        query: 'tor',
        hasSwitchResult: true,
        getSwitchValueResult: '',
    },
    {
        it: 'queried switch present with value',
        query: 'updater-url',
        hasSwitchResult: true,
        getSwitchValueResult: 'https://example.com',
    },
    {
        it: 'queried switch present with empty value',
        query: 'log-file',
        hasSwitchResult: true,
        getSwitchValueResult: '',
    },
    {
        it: 'only first occurence of duplicated switch is valid',
        query: 'log-file',
        args: ['--log-file=foo', '--log-file=bar'],
        hasSwitchResult: true,
        getSwitchValueResult: 'foo',
    },
    {
        it: 'queried switch is only a substring of present switches',
        query: 'log-file',
        args: ['--log-filee', '--log-fileee=', '--log-fileeee=foo'],
        hasSwitchResult: false,
        getSwitchValueResult: '',
    },
];

describe(hasSwitch.name, () => {
    FIXTURES.forEach(f => {
        it(f.it, () => {
            process.argv = f.args ?? BASE_ARGS;
            expect(hasSwitch(f.query)).toBe(f.hasSwitchResult);
        });
    });
});

describe(getSwitchValue.name, () => {
    FIXTURES.forEach(f => {
        it(f.it, () => {
            process.argv = f.args ?? BASE_ARGS;
            expect(getSwitchValue(f.query)).toBe(f.getSwitchValueResult);
        });
    });
});
