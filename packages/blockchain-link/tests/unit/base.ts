import { BaseWorker } from '../../src/workers/base';

const state = new BaseWorker();

describe('Debug', () => {
    it('logs', () => {
        state.settings = {
            name: 'Test',
            debug: true,
        };
        const spyLog = jest.spyOn(console, 'log').mockImplementation();
        const spyWarn = jest.spyOn(console, 'warn').mockImplementation();
        const spyError = jest.spyOn(console, 'error').mockImplementation();
        state.debug('Debug log message');
        state.debug('warn', 'Debug warning message');
        state.debug('error', 'Debug error message');
        expect(spyLog).toHaveBeenCalledTimes(1);
        expect(spyWarn).toHaveBeenCalledTimes(1);
        expect(spyError).toHaveBeenCalledTimes(1);
        jest.clearAllMocks();
    });
});
