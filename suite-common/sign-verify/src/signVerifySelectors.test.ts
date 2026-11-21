import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { type SignAddressesRootState, selectAccountSignAddresses } from './signVerifySelectors';

const fresh = {
    address: 'FRESH',
    path: 'm/0/0',
    transfers: 0,
    balance: '0',
    sent: '0',
    received: '0',
};
const next = { ...fresh, address: 'NEXT', path: 'm/0/1' };
const used = {
    address: 'USED',
    path: 'm/0/2',
    transfers: 1,
    balance: '0',
    sent: '0',
    received: '0',
};
const older = { ...used, address: 'OLDER', path: 'm/0/3' };
const change = { ...used, address: 'CHANGE', path: 'm/1/0' };
const account = mockWalletAccount({
    symbol: asNetworkSymbol('btc'),
    addresses: { unused: [fresh, next], used: [older, used], change: [change] },
});
const state: SignAddressesRootState = { receive: { accounts: {} } };

describe(selectAccountSignAddresses.name, () => {
    it('returns the first fresh address, then used and change addresses newest first', () => {
        expect(selectAccountSignAddresses(state, account)).toEqual([
            { category: 'fresh', addresses: [{ address: fresh.address, path: fresh.path }] },
            {
                category: 'used',
                addresses: [
                    { address: used.address, path: used.path },
                    { address: older.address, path: older.path },
                ],
            },
            { category: 'change', addresses: [{ address: change.address, path: change.path }] },
        ]);
        expect(account.addresses?.used).toEqual([older, used]);
    });

    it("uses the account's touched addresses in place of its first unused address", () => {
        const touchedState: SignAddressesRootState = {
            receive: { accounts: { [account.key]: { touchedAddresses: [next, fresh] } } },
        };
        expect(selectAccountSignAddresses(touchedState, account)[0]).toEqual({
            category: 'fresh',
            addresses: [
                { address: next.address, path: next.path },
                { address: fresh.address, path: fresh.path },
            ],
        });
    });

    it('returns an empty list when the account has no addresses', () => {
        const withoutAddresses: Account = { ...account, addresses: undefined };
        expect(selectAccountSignAddresses(state, withoutAddresses)).toEqual([]);
    });

    it('keeps its result across unrelated state and account changes and interleaved accounts', () => {
        const result = selectAccountSignAddresses(state, account);
        selectAccountSignAddresses(
            state,
            mockWalletAccount({
                symbol: asNetworkSymbol('btc'),
                descriptor: asAccountDescriptor('OTHER'),
            }),
        );
        expect(selectAccountSignAddresses({ ...state }, { ...account, balance: '42' })).toBe(
            result,
        );
    });

    it("updates when the account's touched addresses or available addresses change", () => {
        const result = selectAccountSignAddresses(state, account);
        const touchedState: SignAddressesRootState = {
            receive: { accounts: { [account.key]: { touchedAddresses: [next] } } },
        };
        expect(selectAccountSignAddresses(touchedState, account)).not.toBe(result);
        expect(selectAccountSignAddresses(touchedState, account)[0]).toEqual({
            category: 'fresh',
            addresses: [{ address: next.address, path: next.path }],
        });
        expect(
            selectAccountSignAddresses(state, {
                ...account,
                addresses: {
                    unused: [next],
                    used: [],
                    change: [],
                },
            }),
        ).toEqual([{ category: 'fresh', addresses: [{ address: next.address, path: next.path }] }]);
    });
});
