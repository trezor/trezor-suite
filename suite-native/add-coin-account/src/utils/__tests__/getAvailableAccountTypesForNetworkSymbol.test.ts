import { NORMAL_ACCOUNT_TYPE, networkSymbolCollection } from '@suite-common/wallet-config';
import { isEvmNetwork } from '@suite-common/wallet-utils';

import { getAvailableAccountTypesForNetworkSymbol } from '../getAvailableAccountTypesForNetworkSymbol';

describe('getAvailableAccountTypesForNetworkSymbol', () => {
    it.each(networkSymbolCollection.filter(isEvmNetwork))(
        'returns only the normal account type for EVM network %s',
        symbol => {
            expect(getAvailableAccountTypesForNetworkSymbol({ symbol })).toEqual([
                NORMAL_ACCOUNT_TYPE,
            ]);
        },
    );

    it.each(['ada', 'sol'] as const)(
        'returns only the normal account type for non-EVM exception %s',
        symbol => {
            expect(getAvailableAccountTypesForNetworkSymbol({ symbol })).toEqual([
                NORMAL_ACCOUNT_TYPE,
            ]);
        },
    );

    it('returns supported account types for non-EVM networks', () => {
        expect(getAvailableAccountTypesForNetworkSymbol({ symbol: 'btc' })).toEqual([
            NORMAL_ACCOUNT_TYPE,
            'taproot',
            'segwit',
            'legacy',
        ]);
    });

    it('filters unsupported account types', () => {
        expect(getAvailableAccountTypesForNetworkSymbol({ symbol: 'trx' })).toEqual([
            NORMAL_ACCOUNT_TYPE,
        ]);
    });
});
