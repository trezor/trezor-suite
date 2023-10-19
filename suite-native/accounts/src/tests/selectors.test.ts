import { Account } from '@suite-common/wallet-types';

import { isFilterValueMatchingAccount } from '../selectors';

describe('isFilterValueMatchingAccountLabelOrNetworkName', () => {
    const account = {
        accountLabel: 'Original account name',
        symbol: 'eth',
        tokens: [{ name: 'Tether USD' }],
    } as Account;

    test('should return false if the filter value does not match the account label nor network name.', () => {
        const filterValue = 'not match';

        expect(isFilterValueMatchingAccount(account, filterValue)).toBe(false);
    });

    test('should return false if the filter value does not match the network name.', () => {
        const filterValue = 'bitcoin';

        expect(isFilterValueMatchingAccount(account, filterValue)).toBe(false);
    });

    test('should return true if filter value matches the network name', () => {
        const filterValue = 'ethereum';

        expect(isFilterValueMatchingAccount(account, filterValue)).toBe(true);
    });

    test('should return true if filter value matches the included token name', () => {
        const filterValue = 'tether';

        expect(isFilterValueMatchingAccount(account, filterValue)).toBe(true);
    });

    test('should return true if filter value does match the account label', () => {
        const filterValue = 'Original account';

        expect(isFilterValueMatchingAccount(account, filterValue)).toBe(true);
    });
});
