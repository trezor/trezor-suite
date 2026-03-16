import { Account } from '@suite-common/wallet-types';

import { sortAccountsByNetworksAndAccountTypes } from '../../utils';

describe('sortAccountsByNetworksAndAccountTypes', () => {
    it('accounts sorted by network and account type', () => {
        const fixtureAccounts = [
            { symbol: 'btc', accountType: 'normal' },
            { symbol: 'btc', accountType: 'taproot' },
            { symbol: 'eth', accountType: 'normal' },
            { symbol: 'ltc', accountType: 'segwit' },
            { symbol: 'btc', accountType: 'legacy' },
            { symbol: 'btc', accountType: 'segwit' },
            { symbol: 'btc', accountType: 'normal' },
            { symbol: 'ltc', accountType: 'normal' },
        ] as unknown as Account[];

        const result = sortAccountsByNetworksAndAccountTypes(fixtureAccounts);

        expect(result).toEqual([
            { symbol: 'btc', accountType: 'normal' },
            { symbol: 'btc', accountType: 'normal' },
            { symbol: 'btc', accountType: 'taproot' },
            { symbol: 'btc', accountType: 'segwit' },
            { symbol: 'btc', accountType: 'legacy' },
            { symbol: 'eth', accountType: 'normal' },
            { symbol: 'ltc', accountType: 'normal' },
            { symbol: 'ltc', accountType: 'segwit' },
        ]);
    });
});
