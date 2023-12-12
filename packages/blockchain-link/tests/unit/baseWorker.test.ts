import { BaseWorker } from '../../src/workers/baseWorker';

class MockWorker extends BaseWorker<any> {
    protected isConnected(api: any): api is any {
        return !!api;
    }

    protected tryConnect(): Promise<any> {
        return Promise.resolve();
    }
}

const state = new MockWorker();

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
