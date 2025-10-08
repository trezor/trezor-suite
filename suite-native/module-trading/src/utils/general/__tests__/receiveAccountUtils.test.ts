import type { Account } from '@suite-common/wallet-types';
import type { Address } from '@trezor/blockchain-link-types';

import { getBtcAccount, getEthAccount } from '../../../__fixtures__/account';
import {
    getReceiveAccountAddressText,
    getReceiveAccountFromAccountAndAddressString,
    isFullySelectedReceiveAccount,
} from '../receiveAccountUtils';

describe('receiveAccountUtils', () => {
    describe('isFullySelectedReceiveAccount', () => {
        it('should be false when account is not specified', () => {
            expect(isFullySelectedReceiveAccount(undefined)).toBe(false);
        });

        it('should be false when BTC like account is selected but no receive address is specified', () => {
            expect(isFullySelectedReceiveAccount({ account: getBtcAccount() })).toBe(false);
        });

        it('should be true when both account and address is selected', () => {
            const btcAccount = getBtcAccount();

            expect(
                isFullySelectedReceiveAccount({
                    account: btcAccount,
                    address: btcAccount.addresses!.used[0],
                }),
            ).toBe(true);
        });

        it('should be true when ETH like account is selected', () => {
            expect(isFullySelectedReceiveAccount({ account: getEthAccount() })).toBe(true);
        });
    });

    describe('getReceiveAccountAddressText', () => {
        it('should return undefined when account is not specified', () => {
            expect(getReceiveAccountAddressText(undefined)).toBeUndefined();
        });

        it('should return undefined when only account is specified for BTC', () => {
            expect(
                getReceiveAccountAddressText({
                    account: getBtcAccount(),
                }),
            ).toBeUndefined();
        });

        it('should return selected address', () => {
            const btcAccount = getBtcAccount();

            expect(
                getReceiveAccountAddressText({
                    account: btcAccount,
                    address: btcAccount.addresses!.used[0],
                }),
            ).toBe('1BTC');
        });

        it('should return descriptor when ETH account is specified', () => {
            expect(
                getReceiveAccountAddressText({
                    account: getEthAccount(),
                }),
            ).toBe('descriptor-eth-account-1');
        });

        it('should ignore specified address for ETH', () => {
            expect(
                getReceiveAccountAddressText({
                    account: getEthAccount(),
                    address: { address: 'should_be_ignored' } as Address,
                }),
            ).toBe('descriptor-eth-account-1');
        });
    });

    describe('getReceiveAccountFromAccountAndAddressString', () => {
        let account: Account;

        beforeEach(() => {
            account = getBtcAccount('btc-account-2', {
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
            expect(() =>
                getReceiveAccountFromAccountAndAddressString(getEthAccount(), 'ANYADDRESS'),
            ).toThrow('Account has no addresses');
        });
    });
});
