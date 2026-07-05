import { sortAccountsByCoin } from '../../migrations/account/v4';

describe('sortAccountsByCoin', () => {
    it('sorts persisted accounts by network, account type and index', () => {
        const oldAccounts = [
            { symbol: 'ltc', accountType: 'normal', index: 0 },
            { symbol: 'btc', accountType: 'legacy', index: 0 },
            { symbol: 'btc', accountType: 'normal', index: 1 },
            { symbol: 'eth', accountType: 'normal', index: 0 },
            { symbol: 'btc', accountType: 'normal', index: 0 },
        ];

        expect(sortAccountsByCoin(oldAccounts)).toEqual([
            { symbol: 'btc', accountType: 'normal', index: 0 },
            { symbol: 'btc', accountType: 'normal', index: 1 },
            { symbol: 'btc', accountType: 'legacy', index: 0 },
            { symbol: 'eth', accountType: 'normal', index: 0 },
            { symbol: 'ltc', accountType: 'normal', index: 0 },
        ]);
    });

    it('keeps accounts of networks missing from the current config first without throwing', () => {
        const oldAccounts = [
            { symbol: 'btc', accountType: 'normal', index: 0 },
            { symbol: 'deprecatedcoin', accountType: 'normal', index: 0 },
        ];

        expect(sortAccountsByCoin(oldAccounts)).toEqual([
            { symbol: 'deprecatedcoin', accountType: 'normal', index: 0 },
            { symbol: 'btc', accountType: 'normal', index: 0 },
        ]);
    });

    it('does not mutate the input array', () => {
        const oldAccounts = [
            { symbol: 'eth', accountType: 'normal', index: 0 },
            { symbol: 'btc', accountType: 'normal', index: 0 },
        ];

        sortAccountsByCoin(oldAccounts);

        expect(oldAccounts[0]?.symbol).toBe('eth');
    });
});
