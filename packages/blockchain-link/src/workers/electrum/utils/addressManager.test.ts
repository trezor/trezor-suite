import { createAddressManager } from './addressManager';
import { addressToScripthash } from './transform';

const A = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
const B = '1BitcoinEaterAddressDontSendf59kuE';
const C = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';
const INVALID = 'not-an-address';

const toAccountAddress = (address: string) => ({
    address,
    path: '',
    transfers: 0,
    balance: '0',
    sent: '0',
    received: '0',
});

describe('electrum addressManager', () => {
    it('adds only new distinct addresses and returns their scripthashes', () => {
        const manager = createAddressManager(() => undefined);

        expect(manager.addAddresses([A, B, A])).toEqual([
            addressToScripthash(A),
            addressToScripthash(B),
        ]);
        expect(manager.addAddresses([B, C])).toEqual([addressToScripthash(C)]);
        expect(manager.getCount()).toBe(3);
    });

    it('removes given addresses, or all of them', () => {
        const manager = createAddressManager(() => undefined);
        manager.addAddresses([A, B, C]);

        expect(manager.removeAddresses([A, INVALID])).toEqual([addressToScripthash(A)]);
        expect(manager.getCount()).toBe(2);
        expect(manager.removeAddresses()).toEqual([addressToScripthash(B), addressToScripthash(C)]);
        expect(manager.getCount()).toBe(0);
        // removed addresses can be subscribed again
        expect(manager.addAddresses([A])).toEqual([addressToScripthash(A)]);
    });

    it('adds and removes accounts with their addresses', () => {
        const manager = createAddressManager(() => undefined);
        const addresses = {
            change: [toAccountAddress(C)],
            used: [toAccountAddress(A)],
            unused: [toAccountAddress(B)],
        };
        const account = { descriptor: 'xpub-1', addresses };
        const accountWithoutAddresses = { descriptor: 'xpub-2' };

        expect(manager.addAccounts([account, accountWithoutAddresses])).toEqual([
            addressToScripthash(C),
            addressToScripthash(A),
            addressToScripthash(B),
        ]);
        // already subscribed account is skipped
        expect(manager.addAccounts([account])).toEqual([]);
        expect(manager.getInfo(addressToScripthash(B))).toEqual({
            descriptor: 'xpub-1',
            addresses,
        });
        expect(manager.getInfo('unknown')).toEqual({ descriptor: 'unknown' });

        expect(manager.removeAccounts([account])).toEqual([
            addressToScripthash(C),
            addressToScripthash(A),
            addressToScripthash(B),
        ]);
        expect(manager.getCount()).toBe(0);
        expect(manager.getInfo(addressToScripthash(B))).toEqual({
            descriptor: addressToScripthash(B),
        });
    });
});
