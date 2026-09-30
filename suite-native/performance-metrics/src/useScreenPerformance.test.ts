import { useScreenPerformance } from './useScreenPerformance';

describe('useScreenPerformance outside a Detox test build', () => {
    it('returns an inert handle that logs nothing', () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        const { markInteractive, panHandlers } = useScreenPerformance('home');
        markInteractive();

        expect(panHandlers).toStrictEqual({});
        expect(logSpy).not.toHaveBeenCalled();

        logSpy.mockRestore();
    });

    it('ignores the readiness argument', () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        useScreenPerformance('send', true);

        expect(logSpy).not.toHaveBeenCalled();

        logSpy.mockRestore();
    });

    it('returns a stable handle so instrumented screens do not re-run their effects', () => {
        expect(useScreenPerformance('accounts')).toBe(useScreenPerformance('receive', true));
    });
});
