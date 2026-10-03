import { type Account } from '@suite-common/wallet-types';

import { accountSlip44, isContactsSlip44, networkNameForSlip44, slip44FromPath } from './coin';

const account = (symbol: string, path: string): Account =>
    ({ networkType: 'bitcoin', symbol, path }) as unknown as Account;

describe('contacts coin utils', () => {
    describe('slip44FromPath', () => {
        it('reads mainnet coin type 0', () => {
            expect(slip44FromPath("m/84'/0'/0'/0/5")).toBe(0);
            expect(slip44FromPath("m/44'/0'/0'")).toBe(0);
        });

        it('reads testnet coin type 1 (tolerating the hardening apostrophe)', () => {
            expect(slip44FromPath("m/84'/1'/0'/0/2")).toBe(1);
            expect(slip44FromPath("m/86'/1'/0'")).toBe(1);
        });

        it('falls back to 0 for an unparseable path', () => {
            expect(slip44FromPath('')).toBe(0);
            expect(slip44FromPath('m')).toBe(0);
            expect(slip44FromPath("m/84'")).toBe(0);
        });
    });

    describe('accountSlip44', () => {
        it('derives the coin from the account path', () => {
            expect(accountSlip44(account('btc', "m/84'/0'/0'"))).toBe(0);
            expect(accountSlip44(account('test', "m/84'/1'/0'"))).toBe(1);
        });

        it('falls back to the network template when the path is missing', () => {
            expect(accountSlip44(account('test', ''))).toBe(1);
            expect(accountSlip44(account('btc', ''))).toBe(0);
        });
    });

    describe('isContactsSlip44', () => {
        it('accepts only the Bitcoin mainnet and testnet coin types', () => {
            expect(isContactsSlip44(0)).toBe(true);
            expect(isContactsSlip44(1)).toBe(true);
            [2, 60, -1, 0.5, Number.NaN].forEach(slip44 =>
                expect(isContactsSlip44(slip44)).toBe(false),
            );
        });
    });

    describe('networkNameForSlip44', () => {
        const accounts = [account('btc', "m/84'/0'/0'"), account('test', "m/84'/1'/0'")];

        it('maps a coin type to the real network name of a held account', () => {
            expect(networkNameForSlip44(0, accounts)).toBe('Bitcoin');
            expect(networkNameForSlip44(1, accounts)).toBe('Bitcoin Testnet');
        });

        it('prefers a held account regardless of coin type (regtest reads as Bitcoin Regtest)', () => {
            expect(networkNameForSlip44(1, [account('regtest', "m/84'/1'/0'")])).toBe(
                'Bitcoin Regtest',
            );
        });

        it('falls back to the canonical bitcoin name for a coin the user does not hold', () => {
            const mainnetOnly = [account('btc', "m/84'/0'/0'")];
            expect(networkNameForSlip44(1, mainnetOnly)).toBe('Bitcoin Testnet');
            expect(networkNameForSlip44(0, [account('test', "m/84'/1'/0'")])).toBe('Bitcoin');
        });

        it('returns undefined for an unknown coin type the user holds no account of', () => {
            expect(networkNameForSlip44(99, [account('btc', "m/84'/0'/0'")])).toBeUndefined();
        });
    });
});
