import { ACCOUNT_TYPES } from '../discoverAccounts';

describe('ACCOUNT_TYPES', () => {
    it.each([
        ['tsep', 'normal', "m/44'/60'/0'/0/i"],
        ['tsep', 'legacy', "m/44'/1'/0'/0/i"],
        ['thod', 'normal', "m/44'/60'/0'/0/i"],
        ['thod', 'legacy', "m/44'/1'/0'/0/i"],
    ] as const)('uses %s %s path %s', (symbol, type, path) => {
        expect(ACCOUNT_TYPES).toContainEqual({ symbol, type, path });
    });
});
