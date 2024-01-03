import { Account } from '@suite-common/wallet-types';

import { isFilterValueMatchingAccount, groupAccountsByNetworkAccountType } from '../utils';

describe('isFilterValueMatchingAccountLabelOrNetworkName', () => {
    const account = {
        accountLabel: 'Original account name',
        symbol: 'eth',
        accountType: 'legacy',
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

    test('should return true if filter value matches the account type', () => {
        const filterValue = 'legacy';

        expect(isFilterValueMatchingAccount(account, filterValue)).toBe(true);
    });

    test('should return true if filter value matches the account type', () => {
        const filterValue = 'taproot';

        expect(isFilterValueMatchingAccount(account, filterValue)).toBe(false);
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

describe('groupAccountsByNetworkAccountType', () => {
    it('groups accounts by network and account type', () => {
        const fixtureAccounts = [
            { symbol: 'btc', accountType: 'normal' },
            { symbol: 'btc', accountType: 'normal' },
            { symbol: 'btc', accountType: 'segwit' },
            { symbol: 'btc', accountType: 'legacy' },
            { symbol: 'btc', accountType: 'taproot' },
            { symbol: 'eth', accountType: 'normal' },
            { symbol: 'ltc', accountType: 'segwit' },
        ] as unknown as Account[];

        const result = groupAccountsByNetworkAccountType(fixtureAccounts);

        expect(result).toEqual({
            'Bitcoin default accounts': [
                { symbol: 'btc', accountType: 'normal' },
                { symbol: 'btc', accountType: 'normal' },
            ],
            'Bitcoin Legacy Segwit accounts': [{ symbol: 'btc', accountType: 'segwit' }],
            'Bitcoin Legacy accounts': [{ symbol: 'btc', accountType: 'legacy' }],
            'Bitcoin Taproot accounts': [{ symbol: 'btc', accountType: 'taproot' }],
            'Ethereum accounts': [{ symbol: 'eth', accountType: 'normal' }],
            'Litecoin Legacy Segwit accounts': [{ symbol: 'ltc', accountType: 'segwit' }],
        });
    });
});
