import type { AccountAddresses, Address } from '@trezor/blockchain-link-types';
import { deriveAddresses, networks } from '@trezor/utxo-lib';

import { createAddressManager } from './addressManager';
import { addressToScripthash } from './transform';

// Public test vector, the "all all ... all" seed.
const XPUB =
    'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT';
const OTHER_ACCOUNT = 'other-account';

const getAddress = (index: number) => {
    const [derived] = deriveAddresses(XPUB, 'receive', index, 1, networks.bitcoin);
    if (!derived) throw new Error(`Missing address ${index}`);

    return derived.address;
};
const A = getAddress(0);
const B = getAddress(1);
const C = getAddress(2);
const D = getAddress(3);

const scripthash = (address: string) => addressToScripthash(address, networks.bitcoin);

const accountAddress = (address: string): Address => ({
    address,
    path: "m/84'/0'/0'/0/0",
    transfers: 0,
    balance: '0',
    sent: '0',
    received: '0',
});

const accountAddresses = (used: string[], unused: string[] = []): AccountAddresses => ({
    change: [],
    used: used.map(accountAddress),
    unused: unused.map(accountAddress),
});

const createManager = () => createAddressManager(() => networks.bitcoin);

describe('createAddressManager', () => {
    it('subscribes every address once', () => {
        const manager = createManager();

        expect(manager.addAddresses([A, B, A])).toEqual([scripthash(A), scripthash(B)]);
        expect(manager.addAddresses([A, C])).toEqual([scripthash(C)]);
        expect(manager.getCount()).toBe(3);
    });

    it('resolves a scripthash to its address or to the scripthash itself', () => {
        const manager = createManager();
        manager.addAddresses([A]);

        expect(manager.getInfo(scripthash(A))).toEqual({ descriptor: A, addresses: undefined });
        expect(manager.getInfo(scripthash(B))).toEqual({ descriptor: scripthash(B) });
    });

    it('resolves a scripthash of an account address to the account', () => {
        const manager = createManager();
        const addresses = accountAddresses([A], [B]);

        expect(manager.addAccounts([{ descriptor: XPUB, addresses }])).toEqual([
            scripthash(A),
            scripthash(B),
        ]);
        expect(manager.getInfo(scripthash(B))).toEqual({ descriptor: XPUB, addresses });
    });

    it('resolves an address of two accounts to the first one', () => {
        const manager = createManager();
        manager.addAccounts([
            { descriptor: XPUB, addresses: accountAddresses([A]) },
            { descriptor: OTHER_ACCOUNT, addresses: accountAddresses([A, B]) },
        ]);

        expect(manager.getInfo(scripthash(A))).toMatchObject({ descriptor: XPUB });
        expect(manager.getInfo(scripthash(B))).toMatchObject({ descriptor: OTHER_ACCOUNT });
    });

    it('forgets the addresses of a removed account', () => {
        const manager = createManager();
        manager.addAccounts([
            { descriptor: XPUB, addresses: accountAddresses([A, B]) },
            { descriptor: OTHER_ACCOUNT, addresses: accountAddresses([C]) },
        ]);

        expect(manager.removeAccounts([{ descriptor: XPUB }])).toEqual([
            scripthash(A),
            scripthash(B),
        ]);
        expect(manager.getInfo(scripthash(A))).toEqual({ descriptor: scripthash(A) });
        expect(manager.getInfo(scripthash(C))).toMatchObject({ descriptor: OTHER_ACCOUNT });
        expect(manager.getCount()).toBe(1);
    });

    it('subscribes the addresses of an account again after it was removed', () => {
        const manager = createManager();
        const addresses = accountAddresses([A]);
        manager.addAccounts([{ descriptor: XPUB, addresses }]);
        manager.removeAccounts([{ descriptor: XPUB }]);

        expect(manager.addAccounts([{ descriptor: XPUB, addresses }])).toEqual([scripthash(A)]);
        expect(manager.getInfo(scripthash(A))).toEqual({ descriptor: XPUB, addresses });
    });

    it('does not resolve an address to an account which was removed', () => {
        const manager = createManager();
        manager.addAccounts([{ descriptor: XPUB, addresses: accountAddresses([A]) }]);
        manager.removeAccounts([{ descriptor: XPUB }]);

        manager.addAddresses([A]);

        expect(manager.getInfo(scripthash(A))).toEqual({ descriptor: A, addresses: undefined });
    });

    it('indexes an account listed twice in one call by the addresses it keeps', () => {
        const manager = createManager();
        manager.addAccounts([
            { descriptor: XPUB, addresses: accountAddresses([A, B]) },
            { descriptor: XPUB, addresses: accountAddresses([B]) },
        ]);

        expect(manager.getInfo(scripthash(A))).toEqual({ descriptor: A, addresses: undefined });

        manager.removeAccounts([{ descriptor: XPUB }]);

        expect(manager.getInfo(scripthash(A))).toEqual({ descriptor: A, addresses: undefined });
    });

    it('keeps the account of an address when another account with the address is removed', () => {
        const manager = createManager();
        manager.addAccounts([
            { descriptor: XPUB, addresses: accountAddresses([A]) },
            { descriptor: OTHER_ACCOUNT, addresses: accountAddresses([A, B]) },
        ]);
        manager.removeAccounts([{ descriptor: OTHER_ACCOUNT }]);

        manager.addAddresses([A]);

        expect(manager.getInfo(scripthash(A))).toMatchObject({ descriptor: XPUB });
    });

    it('keeps the first of two forms of an address with the same scripthash', () => {
        const manager = createManager();
        manager.addAccounts([{ descriptor: XPUB, addresses: accountAddresses([A]) }]);

        manager.addAddresses([A.toUpperCase()]);

        expect(manager.getInfo(scripthash(A))).toMatchObject({ descriptor: XPUB });
    });

    it('subscribes nothing of a batch with an invalid address', () => {
        const manager = createManager();

        expect(() => manager.addAddresses([A, 'invalid', B])).toThrow();
        expect(manager.addAddresses([A])).toEqual([scripthash(A)]);
    });

    it('forgets removed addresses and keeps the others', () => {
        const manager = createManager();
        manager.addAddresses([A, B, C]);

        expect(manager.removeAddresses([B, D])).toEqual([scripthash(B)]);
        expect(manager.getInfo(scripthash(B))).toEqual({ descriptor: scripthash(B) });
        expect(manager.getInfo(scripthash(C))).toMatchObject({ descriptor: C });
    });

    it('forgets everything when nothing is specified', () => {
        const manager = createManager();
        manager.addAccounts([{ descriptor: XPUB, addresses: accountAddresses([A]) }]);
        manager.addAddresses([B]);

        manager.removeAccounts();
        manager.removeAddresses();

        expect(manager.getCount()).toBe(0);
        expect(manager.getInfo(scripthash(A))).toEqual({ descriptor: scripthash(A) });
        expect(manager.getInfo(scripthash(B))).toEqual({ descriptor: scripthash(B) });
    });
});
