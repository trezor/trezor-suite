import { Account, AccountKey, asAccountDescriptor } from '@suite-common/wallet-types';

import { selectFreshAccountAddress } from '../selectFreshAccountAddress';

describe('selectFreshAccountAddress', () => {
    const mockAccount = {
        symbol: 'btc',
        key: 'btc-1' as AccountKey, // Todo: create properly via `createAccountKey()`,
        addresses: {
            unused: [
                {
                    address: 'unused1',
                    path: "m/44'/0'/0'/0/0",
                    transfers: 0,
                    balance: '0',
                    sent: '0',
                    received: '0',
                },
                {
                    address: 'unused2',
                    path: "m/44'/0'/0'/0/1",
                    transfers: 0,
                    balance: '0',
                    sent: '0',
                    received: '0',
                },
            ],
            used: [
                {
                    address: 'used1',
                    path: "m/44'/0'/0'/0/2",
                    transfers: 1,
                    balance: '0',
                    sent: '0',
                    received: '0',
                },
                {
                    address: 'used2',
                    path: "m/44'/0'/0'/0/3",
                    transfers: 1,
                    balance: '0',
                    sent: '0',
                    received: '0',
                },
            ],
            change: [],
        },
        deviceState: 'device@state:1',
        index: 0,
        path: "m/44'/0'/0'",
        descriptor: asAccountDescriptor('descriptor'),
        accountType: 'normal',
        empty: false,
        visible: true,
        balance: '0',
        availableBalance: '0',
        formattedBalance: '0',
        tokens: [],
        utxo: [],
        history: {
            total: 0,
            unconfirmed: 0,
        },
        metadata: {
            key: 'btc-1',
        },
        ts: 0,
        networkType: 'bitcoin',
        misc: undefined,
        marker: undefined,
        page: undefined,
        stellarCursor: undefined,
    } as Account;

    const mockState = {
        wallet: {
            accounts: [mockAccount],
            pendingAccountAddresses: {},
            transactions: {
                transactions: {},
                phishing: {},
                fetchStatusDetail: {},
            },
        },
    };

    it('should return null when account is not provided', () => {
        const result = selectFreshAccountAddress(
            mockState,
            'non-existent-key' as AccountKey, // Todo: create properly via `createAccountKey()`
        );
        expect(result).toBeNull();
    });

    it('should return first unused address for account', () => {
        const result = selectFreshAccountAddress(mockState, mockAccount.key);
        expect(result).toEqual({
            address: 'unused1',
            path: "m/44'/0'/0'/0/0",
            transfers: 0,
            balance: '0',
            sent: '0',
            received: '0',
        });
    });

    it('should return undefined when no unused addresses are available', () => {
        const accountWithoutUnused = {
            ...mockAccount,
            addresses: {
                unused: [],
                used: [
                    {
                        address: 'used1',
                        path: "m/44'/0'/0'/0/2",
                        transfers: 1,
                        balance: '0',
                        sent: '0',
                        received: '0',
                    },
                ],
                change: [],
            },
        };
        const stateWithoutUnused = {
            wallet: {
                accounts: [accountWithoutUnused],
                pendingAccountAddresses: {},
                transactions: {
                    transactions: {},
                    phishing: {},
                    fetchStatusDetail: {},
                },
            },
        };
        const result = selectFreshAccountAddress(stateWithoutUnused, accountWithoutUnused.key);
        expect(result).toBeUndefined();
    });

    it('should return stable results for same inputs', () => {
        const result1 = selectFreshAccountAddress(mockState, mockAccount.key);
        const result2 = selectFreshAccountAddress(mockState, mockAccount.key);

        expect(result1).toEqual(result2);
        expect(result1).toBe(result2);
    });
});
