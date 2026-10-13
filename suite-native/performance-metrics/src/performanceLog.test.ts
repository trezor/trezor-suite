import { PERFORMANCE_LOG_PREFIX } from './constants';
import { formatPerformanceLogLine, logPerformanceSample } from './performanceLog';
import { type PerformanceSample } from './types';

const sample: PerformanceSample = {
    screen: 'home',
    ttffMs: 123.4,
    ttiMs: 456.7,
    fidMs: 12.3,
    score: 87,
    timestamp: 1750000000000,
};

describe('formatPerformanceLogLine', () => {
    it('writes the prefix, one space and the sample as a single JSON line', () => {
        expect(formatPerformanceLogLine(sample)).toBe(
            '__TREZOR_PERF__ {"screen":"home","ttffMs":123.4,"ttiMs":456.7,"fidMs":12.3,"score":87,"timestamp":1750000000000}',
        );
    });

    it('never breaks the line, so a log reader can parse it as one record', () => {
        const line = formatPerformanceLogLine({ ...sample, ttiMs: null, fidMs: null });

        expect(line).not.toContain('\n');
        expect(JSON.parse(line.slice(PERFORMANCE_LOG_PREFIX.length + 1))).toStrictEqual({
            ...sample,
            ttiMs: null,
            fidMs: null,
        });
    });
});

describe('logPerformanceSample', () => {
    const originalDetoxBuildEnv = process.env.EXPO_PUBLIC_IS_DETOX_BUILD;
    let logSpy: jest.SpyInstance;

    beforeEach(() => {
        logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        process.env.EXPO_PUBLIC_IS_DETOX_BUILD = originalDetoxBuildEnv;
        logSpy.mockRestore();
    });

    it('emits the sample in a Detox test build', () => {
        process.env.EXPO_PUBLIC_IS_DETOX_BUILD = 'true';

        logPerformanceSample(sample);

        expect(logSpy).toHaveBeenCalledWith(formatPerformanceLogLine(sample));
    });

    it('stays silent outside a Detox test build', () => {
        delete process.env.EXPO_PUBLIC_IS_DETOX_BUILD;

        logPerformanceSample(sample);

        expect(logSpy).not.toHaveBeenCalled();
    });
});
