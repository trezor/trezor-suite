import { asNetworkSymbol } from '@suite-common/wallet-config';
import type { Account } from '@suite-common/wallet-types';
import {
    mockCardanoStakingAccount,
    mockEthereumStakingAccount,
    mockSolanaStakingAccount,
    mockTronStakingAccount,
    mockWalletAccount,
} from '@suite-common/wallet-types/mocks';

import { getAccountTotalStakingBalance } from './stakingUtils';

describe('getAccountTotalStakingBalance characterization', () => {
    it.each<{ name: string; account: Account; expected: string | null }>([
        { name: 'eth none', account: mockEthereumStakingAccount('none'), expected: '0' },
        { name: 'eth pending', account: mockEthereumStakingAccount('pending'), expected: '0.75' },
        { name: 'eth active', account: mockEthereumStakingAccount('active'), expected: '2.05' },
        {
            name: 'eth unstaking',
            account: mockEthereumStakingAccount('unstaking'),
            expected: '1.52',
        },
        {
            name: 'eth claimable',
            account: mockEthereumStakingAccount('claimable'),
            expected: '1.52',
        },
        {
            name: 'eth partiallyClaimable',
            account: mockEthereumStakingAccount('partiallyClaimable'),
            expected: '0.5',
        },
        { name: 'eth otherPool', account: mockEthereumStakingAccount('otherPool'), expected: '0' },
        {
            name: 'thod active',
            account: mockEthereumStakingAccount('active', { symbol: asNetworkSymbol('thod') }),
            expected: '2.05',
        },
        { name: 'sol none', account: mockSolanaStakingAccount('none'), expected: null },
        { name: 'sol activating', account: mockSolanaStakingAccount('activating'), expected: '2' },
        { name: 'sol active', account: mockSolanaStakingAccount('active'), expected: '5' },
        {
            name: 'sol deactivating',
            account: mockSolanaStakingAccount('deactivating'),
            expected: '2',
        },
        {
            name: 'sol deactivated',
            account: mockSolanaStakingAccount('deactivated'),
            expected: '1.5',
        },
        { name: 'sol mixed', account: mockSolanaStakingAccount('mixed'), expected: '7.8' },
        {
            name: 'sol externalOnly',
            account: mockSolanaStakingAccount('externalOnly'),
            expected: null,
        },
        {
            name: 'sol everstakeAndExternal',
            account: mockSolanaStakingAccount('everstakeAndExternal'),
            expected: '5',
        },
        {
            name: 'dsol active',
            account: mockSolanaStakingAccount('active', { symbol: asNetworkSymbol('dsol') }),
            expected: '5',
        },
        {
            name: 'ada notDelegated',
            account: mockCardanoStakingAccount('notDelegated'),
            expected: null,
        },
        {
            name: 'ada everstake',
            account: mockCardanoStakingAccount('everstake'),
            expected: '1000',
        },
        {
            name: 'ada everstakeNoRewards',
            account: mockCardanoStakingAccount('everstakeNoRewards'),
            expected: '1000',
        },
        {
            name: 'ada fiveBinaries',
            account: mockCardanoStakingAccount('fiveBinaries'),
            expected: '1000',
        },
        {
            name: 'ada externalPool',
            account: mockCardanoStakingAccount('externalPool'),
            expected: '1000',
        },
        { name: 'trx none', account: mockTronStakingAccount('none'), expected: null },
        {
            name: 'trx frozenNotVoted',
            account: mockTronStakingAccount('frozenNotVoted'),
            expected: '1000',
        },
        {
            name: 'trx votedSplit',
            account: mockTronStakingAccount('votedSplit'),
            expected: '1000',
        },
        {
            name: 'trx votedExternal',
            account: mockTronStakingAccount('votedExternal'),
            expected: '1000',
        },
        {
            name: 'trx unstakingPending',
            account: mockTronStakingAccount('unstakingPending'),
            expected: '500',
        },
        {
            name: 'trx unstakingWithdrawable',
            account: mockTronStakingAccount('unstakingWithdrawable'),
            expected: '500',
        },
        {
            name: 'btc',
            account: mockWalletAccount({ symbol: asNetworkSymbol('btc') }),
            expected: null,
        },
    ])('$name', ({ account, expected }) => {
        expect(getAccountTotalStakingBalance(account)).toEqual(expected);
    });
});
