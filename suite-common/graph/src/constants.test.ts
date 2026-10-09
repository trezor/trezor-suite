import { asNetworkSymbol } from '@suite-common/wallet-config';

import { isIgnoredBalanceHistoryAccount } from './constants';

describe(isIgnoredBalanceHistoryAccount.name, () => {
    it.each([
        { symbol: 'sol', backendType: 'solana', expected: true, reason: 'the network is ignored' },
        {
            symbol: 'arc',
            backendType: 'evm-rpc',
            expected: true,
            reason: 'a direct-RPC backend serves no balance history',
        },
        {
            symbol: 'eth',
            backendType: 'evm-rpc',
            expected: true,
            reason: 'a custom direct-RPC backend serves no balance history either',
        },
        { symbol: 'eth', backendType: 'blockbook', expected: false, reason: 'blockbook serves it' },
        {
            symbol: 'btc',
            backendType: undefined,
            expected: false,
            reason: 'an unreported backend is the network default',
        },
    ] as const)(
        'is $expected for $symbol on $backendType because $reason',
        ({ symbol, backendType, expected }) => {
            expect(
                isIgnoredBalanceHistoryAccount({ symbol: asNetworkSymbol(symbol), backendType }),
            ).toBe(expected);
        },
    );
});
