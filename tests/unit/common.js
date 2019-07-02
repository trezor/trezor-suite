import * as common from '../../src/workers/common';
import fixtures from './fixtures/common';

describe('Add and remove address in sequence', () => {
    fixtures.addAddresses.forEach(f => {
        it('add address', () => {
            if (f.error) {
                expect(() => common.addAddresses(f.input)).toThrow('Invalid parameter: addresses');
            } else {
                expect(common.addAddresses(f.input)).toEqual(f.unique);
                expect(common.getAddresses()).toEqual(f.subscribed);
            }
            // try {
            //     expect(common.addAddresses(f.input)).toEqual(f.unique);
            //     expect(common.getAddresses()).toEqual(f.subscribed);
            // } catch (error) {
            //     expect(error.message).toEqual('Invalid parameter: addresses');
            // }
        });
    });

    fixtures.removeAddresses.forEach(f => {
        it('remove address', () => {
            if (f.error) {
                expect(() => common.removeAddresses(f.input)).toThrow(
                    'Invalid parameter: addresses'
                );
            } else {
                expect(common.removeAddresses(f.input)).toEqual(f.subscribed);
                expect(common.getAddresses()).toEqual(f.subscribed);
            }
        });
    });
});

describe('Add and remove account in sequence', () => {
    fixtures.addAccounts.forEach(f => {
        it('add account', () => {
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
        });
        common.debug('Debug log message');
        common.debug('warn', 'Debug warning message');
        common.debug('error', 'Debug error message');
    });
});
