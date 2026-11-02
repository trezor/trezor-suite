import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { getMerklRewardsQueryEntriesForAccounts } from './useGetMerklRewardsQueryEntries';

const emptyEthereumAccount = mockWalletAccount(
    {
        symbol: asNetworkSymbol('eth'),
        descriptor: asAccountDescriptor('0xff6845f200000000000000000000000013fb4863'),
    },
    { misc: { nonce: '0' } },
);

describe('getMerklRewardsQueryEntriesForAccounts', () => {
    it.each([
        ['eth', 1],
        ['arb', 42161],
        ['base', 8453],
        ['op', 10],
    ] as const)(
        'queries %s rewards without requiring a current vault or token balance',
        (symbol, chainId) => {
            const account = mockWalletAccount({
                symbol: asNetworkSymbol(symbol),
                descriptor: emptyEthereumAccount.descriptor,
                tokens: [],
                balance: '0',
            });

            expect(getMerklRewardsQueryEntriesForAccounts([account])).toEqual([
                { chainId, address: account.descriptor },
            ]);
        },
    );

    it('rejects non-EVM accounts and EVM chains without a claim contract', () => {
        const accounts = ['btc', 'pol', 'tsep'].map(symbol =>
            mockWalletAccount({ symbol: asNetworkSymbol(symbol) }),
        );

        expect(getMerklRewardsQueryEntriesForAccounts(accounts)).toEqual([]);
        expect(
            getMerklRewardsQueryEntriesForAccounts(accounts, { skipEmptyAccountCheck: true }),
        ).toEqual([]);
    });

    it('deduplicates addresses per chain while preserving the same address on another chain', () => {
        const ethAccount = mockWalletAccount({
            symbol: asNetworkSymbol('eth'),
            descriptor: emptyEthereumAccount.descriptor,
        });
        const arbAccount = mockWalletAccount({
            symbol: asNetworkSymbol('arb'),
            descriptor: ethAccount.descriptor,
        });

        expect(
            getMerklRewardsQueryEntriesForAccounts([ethAccount, ethAccount, arbAccount]),
        ).toEqual([
            { chainId: 1, address: ethAccount.descriptor },
            { chainId: 42161, address: arbAccount.descriptor },
        ]);
    });

    it('allows callers to include empty EVM accounts when active positions are known', () => {
        expect(getMerklRewardsQueryEntriesForAccounts([emptyEthereumAccount])).toEqual([]);
        expect(
            getMerklRewardsQueryEntriesForAccounts([emptyEthereumAccount], {
                skipEmptyAccountCheck: true,
            }),
        ).toEqual([
            {
                chainId: 1,
                address: emptyEthereumAccount.descriptor,
            },
        ]);
    });
});
