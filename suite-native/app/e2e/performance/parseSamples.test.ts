import { PERFORMANCE_LOG_PREFIX } from '@suite-native/performance-metrics';

import { createSample, toLogcatLine, toSampleLine } from './fixtures';
import { dedupeSamples, parsePerformanceLog, parsePerformanceLogs } from './parseSamples';

describe('parsePerformanceLog', () => {
    it('reads a sample out of a logcat line and ignores unrelated output', () => {
        const sample = createSample('home');
        const log = [
            toLogcatLine('Running application "TrezorSuite"'),
            toSampleLine(sample),
            toLogcatLine('Something else entirely'),
        ].join('\n');

        expect(parsePerformanceLog(log)).toEqual({ samples: [sample], malformedLineCount: 0 });
    });

    it('reads a sample from a bare line without a logcat preamble', () => {
        const sample = createSample('send');

        expect(
            parsePerformanceLog(`${PERFORMANCE_LOG_PREFIX} ${JSON.stringify(sample)}`).samples,
        ).toEqual([sample]);
    });

    it('keeps null metrics as null', () => {
        const sample = createSample('receive', { ttiMs: null, fidMs: null, score: null });

        expect(parsePerformanceLog(toSampleLine(sample)).samples).toEqual([sample]);
    });

    it('keeps a screen name the report does not know about', () => {
        const log = `${PERFORMANCE_LOG_PREFIX} ${JSON.stringify({
            ...createSample('home'),
            screen: 'brand-new-screen',
        })}`;

        expect(parsePerformanceLog(log).samples[0]?.screen).toBe('brand-new-screen');
    });

    it.each([
        ['broken json', `${PERFORMANCE_LOG_PREFIX} {"screen":"home"`],
        ['no payload', `${PERFORMANCE_LOG_PREFIX}`],
        ['not an object', `${PERFORMANCE_LOG_PREFIX} "home"`],
        [
            'empty screen',
            `${PERFORMANCE_LOG_PREFIX} ${JSON.stringify({ ...createSample('home'), screen: '' })}`,
        ],
        [
            'missing metric',
            `${PERFORMANCE_LOG_PREFIX} {"screen":"home","ttffMs":1,"ttiMs":2,"score":3,"timestamp":4}`,
        ],
        [
            'metric is not a number',
            `${PERFORMANCE_LOG_PREFIX} ${JSON.stringify({ ...createSample('home'), ttffMs: '120' })}`,
        ],
        [
            'timestamp is missing',
            `${PERFORMANCE_LOG_PREFIX} ${JSON.stringify({ ...createSample('home'), timestamp: null })}`,
        ],
    ])('counts a %s line as malformed instead of throwing', (_name, line) => {
        expect(parsePerformanceLog(toLogcatLine(line))).toEqual({
            samples: [],
            malformedLineCount: 1,
        });
    });

    it('returns nothing for an empty log', () => {
        expect(parsePerformanceLog('')).toEqual({ samples: [], malformedLineCount: 0 });
    });
});

describe('dedupeSamples', () => {
    it('drops a repeated emission of the same screen at the same millisecond', () => {
        const sample = createSample('home');

        expect(dedupeSamples([sample, { ...sample }, createSample('accounts')])).toEqual([
            sample,
            createSample('accounts'),
        ]);
    });

    it('keeps two visits of the same screen at different times', () => {
        const first = createSample('home');
        const second = createSample('home', { timestamp: 1750000009999 });

        expect(dedupeSamples([first, second])).toHaveLength(2);
    });
});

describe('parsePerformanceLogs', () => {
    it('merges logs, dedupes overlapping windows and sums malformed lines', () => {
        const home = createSample('home');
        const accounts = createSample('accounts', { timestamp: 1750000001000 });

        expect(
            parsePerformanceLogs([
                [toSampleLine(home), `${PERFORMANCE_LOG_PREFIX} nonsense`].join('\n'),
                [toSampleLine(home), toSampleLine(accounts), 'unrelated'].join('\n'),
            ]),
        ).toEqual({ samples: [home, accounts], malformedLineCount: 1 });
    });
});
