import { Account } from '@suite-common/wallet-types';

import { groupAccountsByNetworkAccountType } from '../../utils';

describe('groupAccountsByNetworkAccountType', () => {
    it('groups accounts by network and account type', () => {
        const fixtureAccounts = [
            { symbol: 'btc', accountType: 'normal' },
            { symbol: 'btc', accountType: 'normal' },
            { symbol: 'btc', accountType: 'segwit' },
            { symbol: 'btc', accountType: 'legacy' },
            { symbol: 'btc', accountType: 'taproot' },
            { symbol: 'eth', accountType: 'normal' },
            { symbol: 'ltc', accountType: 'segwit' },
        ] as unknown as Account[];

        const result = groupAccountsByNetworkAccountType(fixtureAccounts);

        expect(result).toEqual({
            'Bitcoin default accounts': [
                { symbol: 'btc', accountType: 'normal' },
                { symbol: 'btc', accountType: 'normal' },
            ],
            'Bitcoin Legacy Segwit accounts': [{ symbol: 'btc', accountType: 'segwit' }],
            'Bitcoin Legacy accounts': [{ symbol: 'btc', accountType: 'legacy' }],
            'Bitcoin Taproot accounts': [{ symbol: 'btc', accountType: 'taproot' }],
            'Ethereum default accounts': [{ symbol: 'eth', accountType: 'normal' }],
            'Litecoin Legacy Segwit accounts': [{ symbol: 'ltc', accountType: 'segwit' }],
        });
    });
});
