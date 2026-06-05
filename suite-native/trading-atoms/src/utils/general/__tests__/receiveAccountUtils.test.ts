import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { getBtcAccount, getEthAccount } from '@suite-native/trading-fixtures';

import { getReceiveAccountFromAccountAndAddressString } from '../receiveAccountUtils';

describe('receiveAccountUtils', () => {
    describe('getReceiveAccountFromAccountAndAddressString', () => {
        let account: Account;

        beforeEach(() => {
            account = getBtcAccount({
                descriptor: asAccountDescriptor('btcAccount2'),
                addresses: {
                    used: [
                        {
                            address: 'USED1',
                            path: 'm/84/0/0',
                            transfers: 0,
                            balance: '0',
                            sent: '0',
                            received: '0',
                        },
                    ],
                    change: [
                        {
                            address: 'CHANGE',
                            path: 'm/84/0/3',
                            transfers: 0,
                            balance: '0',
                            sent: '0',
                            received: '0',
                        },
                    ],
                    unused: [
                        {
                            address: 'UNUSED1',
                            path: 'm/84/0/1',
                            transfers: 0,
                            balance: '0',
                            sent: '0',
                            received: '0',
                        },
                        {
                            address: 'UNUSED2',
                            path: 'm/84/0/2',
                            transfers: 0,
                            balance: '0',
                            sent: '0',
                            received: '0',
                        },
                    ],
                },
            });
        });

        it('should return account when no address is specified', () => {
            expect(getReceiveAccountFromAccountAndAddressString(account)).toEqual({ account });
        });

        it('should return account and address when used address is specified', () => {
            expect(getReceiveAccountFromAccountAndAddressString(account, 'USED1')).toEqual({
                account,
                address: account.addresses!.used[0],
            });
        });

        it('should return account and address when unused address is specified', () => {
            expect(getReceiveAccountFromAccountAndAddressString(account, 'UNUSED2')).toEqual({
                account,
                address: account.addresses!.unused[1],
            });
        });

        it('should return account and address when change address is specified', () => {
            expect(getReceiveAccountFromAccountAndAddressString(account, 'CHANGE')).toEqual({
                account,
                address: account.addresses!.change[0],
            });
        });

        it('should throw when invalid address string is specified', () => {
            expect(() =>
                getReceiveAccountFromAccountAndAddressString(account, 'NONEXISTING'),
            ).toThrow('Address not found in the account');
        });

        it('should throw when address is specified for account without addresses', () => {
            const ethAccount = getEthAccount();
            expect(getReceiveAccountFromAccountAndAddressString(ethAccount, 'ANYADDRESS')).toEqual({
                account: ethAccount,
            });
        });
    });
});
