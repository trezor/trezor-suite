import WorkerCommon from '../../src/workers/common';
import fixtures from './fixtures/common';

declare function postMessage(data: any): void;
const common = new WorkerCommon(postMessage);

describe('Add and remove address in sequence', () => {
    fixtures.addAddresses.forEach(f => {
        it('add address', () => {
            try {
                // @ts-ignore invalid param
                const unique = common.addAddresses(f.input);
                expect(unique).toEqual(f.unique);
                expect(common.getAddresses()).toEqual(f.subscribed);
            } catch (error) {
                expect(error.message).toEqual(f.error);
            }
        });
    });

    fixtures.removeAddresses.forEach(f => {
        it('remove address', () => {
            try {
                // @ts-ignore invalid param
                const unique = common.removeAddresses(f.input);
                expect(unique).toEqual(f.subscribed);
                expect(common.getAddresses()).toEqual(f.subscribed);
            } catch (error) {
                expect(error.message).toEqual(f.error);
            }
        });
    });
});

describe('Add and remove account in sequence', () => {
    fixtures.addAccounts.forEach(f => {
        it('add account', () => {
            // @ts-ignore invalid param
            common.addAccounts(f.input);
            expect(common.getAccounts()).toEqual(f.subscribedAccounts);
            expect(common.getAddresses()).toEqual(f.subscribedAddresses);
        });
    });

    fixtures.removeAccounts.forEach(f => {
        it('remove account', () => {
            common.removeAccounts(f.input);
            expect(common.getAccounts()).toEqual(f.subscribedAccounts);
            expect(common.getAddresses()).toEqual(f.subscribedAddresses);
        });
    });
});

describe('Debug', () => {
    it('logs', () => {
        common.setSettings({
            name: 'Test',
            debug: true,
            worker: 'foo.js',
            server: [],
        });
        const spyLog = jest.spyOn(console, 'log').mockImplementation();
        const spyWarn = jest.spyOn(console, 'warn').mockImplementation();
        const spyError = jest.spyOn(console, 'error').mockImplementation();
        common.debug('Debug log message');
        common.debug('warn', 'Debug warning message');
        common.debug('error', 'Debug error message');
        expect(spyLog).toHaveBeenCalledTimes(1);
        expect(spyWarn).toHaveBeenCalledTimes(1);
        expect(spyError).toHaveBeenCalledTimes(1);
        jest.clearAllMocks();
    });
});
