import { createAddressManager } from './addressManager';
import { addressToScripthash } from './transform';

const P2PKH_ADDRESS = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
const BURN_ADDRESS = '1BitcoinEaterAddressDontSendf59kuE';
const P2WPKH_ADDRESS = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';
const INVALID_ADDRESS = 'not-an-address';

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

        expect(manager.addAddresses([P2PKH_ADDRESS, BURN_ADDRESS, P2PKH_ADDRESS])).toEqual([
            addressToScripthash(P2PKH_ADDRESS),
            addressToScripthash(BURN_ADDRESS),
        ]);
        expect(manager.addAddresses([BURN_ADDRESS, P2WPKH_ADDRESS])).toEqual([
            addressToScripthash(P2WPKH_ADDRESS),
        ]);
        expect(manager.getCount()).toBe(3);
    });

    it('removes given addresses, or all of them', () => {
        const manager = createAddressManager(() => undefined);
        manager.addAddresses([P2PKH_ADDRESS, BURN_ADDRESS, P2WPKH_ADDRESS]);

        expect(manager.removeAddresses([P2PKH_ADDRESS, INVALID_ADDRESS])).toEqual([
            addressToScripthash(P2PKH_ADDRESS),
        ]);
        expect(manager.getCount()).toBe(2);
        expect(manager.removeAddresses()).toEqual([
            addressToScripthash(BURN_ADDRESS),
            addressToScripthash(P2WPKH_ADDRESS),
        ]);
        expect(manager.getCount()).toBe(0);
        // Removed addresses can be subscribed again.
        expect(manager.addAddresses([P2PKH_ADDRESS])).toEqual([addressToScripthash(P2PKH_ADDRESS)]);
    });

    it('adds and removes accounts with their addresses', () => {
        const manager = createAddressManager(() => undefined);
        const addresses = {
            change: [toAccountAddress(P2WPKH_ADDRESS)],
            used: [toAccountAddress(P2PKH_ADDRESS)],
            unused: [toAccountAddress(BURN_ADDRESS)],
        };
        const account = { descriptor: 'xpub-1', addresses };
        const accountWithoutAddresses = { descriptor: 'xpub-2' };

        expect(manager.addAccounts([account, accountWithoutAddresses])).toEqual([
            addressToScripthash(P2WPKH_ADDRESS),
            addressToScripthash(P2PKH_ADDRESS),
            addressToScripthash(BURN_ADDRESS),
        ]);
        // An already subscribed account is skipped.
        expect(manager.addAccounts([account])).toEqual([]);
        expect(manager.getInfo(addressToScripthash(BURN_ADDRESS))).toEqual({
            descriptor: 'xpub-1',
            addresses,
        });
        expect(manager.getInfo('unknown')).toEqual({ descriptor: 'unknown' });

        expect(manager.removeAccounts([account])).toEqual([
            addressToScripthash(P2WPKH_ADDRESS),
            addressToScripthash(P2PKH_ADDRESS),
            addressToScripthash(BURN_ADDRESS),
        ]);
        expect(manager.getCount()).toBe(0);
        expect(manager.getInfo(addressToScripthash(BURN_ADDRESS))).toEqual({
            descriptor: addressToScripthash(BURN_ADDRESS),
        });
    });
});
