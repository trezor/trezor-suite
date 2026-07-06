import { ACCOUNT_TYPES } from '@trezor/connect-common';

// Account discovery enumerates the per-coin derivation templates in ACCOUNT_TYPES
// (see discoverAccounts.ts: `ACCOUNT_TYPES.filter(a => a.symbol === symbol)`). A network with
// no entry is silently dropped from discovery — no account is ever created, and the "Add account"
// modal then shows "Account discovery error" (verifyAvailability → MODAL_ADD_ACCOUNT_NO_ACCOUNT).
// The Suite-side selectDiscoveryAccountsParam casts to the param type, so this gap is NOT caught at
// compile time. These tests lock the invariant for the coins that rely on it.
describe('ACCOUNT_TYPES discovery templates', () => {
    it('includes Monero (xmr) with its SLIP-0010 ed25519 path', () => {
        const xmr = ACCOUNT_TYPES.filter(a => a.symbol === 'xmr');
        expect(xmr).toEqual([{ symbol: 'xmr', type: 'normal', path: "m/44'/128'/i'" }]);
    });

    it('has no duplicate (symbol, type) templates', () => {
        const keys = ACCOUNT_TYPES.map(a => `${a.symbol}-${a.type}`);
        expect(new Set(keys).size).toBe(keys.length);
    });

    it('every template uses the substitutable account-index placeholder', () => {
        // discoverAccounts substitutes the literal `i` for the account index; a template without it
        // would derive the same account for every index.
        ACCOUNT_TYPES.forEach(({ path }) => expect(path).toContain('i'));
    });
});
