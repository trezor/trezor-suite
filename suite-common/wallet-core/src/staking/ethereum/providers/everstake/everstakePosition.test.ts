import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type StakingPool } from '@trezor/blockchain-link-types';
import { EVERSTAKE_CONTRACTS } from '@trezor/network-ethereum/staking';

import { deriveEverstakePosition, findEverstakeStakingPool } from './everstakePosition';

const ethSymbol = asNetworkSymbol('eth');

const everstakePool = (pool: Partial<StakingPool> = {}): StakingPool => ({
    name: 'Everstake',
    contract: EVERSTAKE_CONTRACTS[1].accounting,
    autocompoundBalance: '3234000000000000000',
    claimableAmount: '500000000000000000',
    depositedBalance: '3000000000000000000',
    pendingBalance: '100000000000000000',
    pendingDepositedBalance: '200000000000000000',
    restakedReward: '234000000000000000',
    withdrawTotalAmount: '500000000000000000',
    ...pool,
});

const ethereumAccount = (stakingPools: StakingPool[] | undefined, symbol = ethSymbol): Account =>
    ({
        ...mockWalletAccount({ symbol }),
        networkType: 'ethereum',
        misc: { nonce: '0', stakingPools },
    }) as Account;

describe(findEverstakeStakingPool.name, () => {
    it('finds the pool by the accounting contract regardless of case', () => {
        const pool = everstakePool({ contract: EVERSTAKE_CONTRACTS[1].accounting.toLowerCase() });

        expect(findEverstakeStakingPool(ethSymbol, [pool])).toBe(pool);
    });

    it('finds the pool by the deposit contract', () => {
        const pool = everstakePool({ contract: EVERSTAKE_CONTRACTS[1].pool });

        expect(findEverstakeStakingPool(ethSymbol, [pool])).toBe(pool);
    });

    it('ignores pools of other contracts and other networks', () => {
        const unknown = everstakePool({ contract: '0x624087DD1904ab122A32878Ce9e933C7071F53B9' });
        const hoodi = everstakePool({ contract: EVERSTAKE_CONTRACTS[560048].accounting });

        expect(findEverstakeStakingPool(ethSymbol, [unknown, hoodi])).toBeUndefined();
        expect(findEverstakeStakingPool(asNetworkSymbol('btc'), [everstakePool()])).toBeUndefined();
        expect(findEverstakeStakingPool(ethSymbol, undefined)).toBeUndefined();
    });
});

describe(deriveEverstakePosition.name, () => {
    it('maps the accounting balances to a position in ether', () => {
        const account = ethereumAccount([everstakePool()]);

        expect(deriveEverstakePosition(account)).toEqual({
            accountKey: account.key,
            symbol: ethSymbol,
            providerId: 'everstake',
            kind: 'pooled',
            staked: '3',
            withdrawable: '3.234',
            pendingStake: '0.3',
            activating: '0.2',
            unstaking: '0.5',
            claimable: '0.5',
            rewards: '0.234',
            canClaim: true,
            total: '4.034',
            details: { providerId: 'everstake', pool: everstakePool() },
        });
    });

    it('cannot claim while the withdraw request is only partly filled', () => {
        const account = ethereumAccount([
            everstakePool({ withdrawTotalAmount: '500000000000000000', claimableAmount: '1' }),
        ]);

        expect(deriveEverstakePosition(account)).toMatchObject({
            canClaim: false,
            unstaking: '0.5',
            claimable: '0.000000000000000001',
        });
    });

    it('cannot claim when nothing is claimable', () => {
        const account = ethereumAccount([
            everstakePool({ withdrawTotalAmount: '0', claimableAmount: '0' }),
        ]);

        expect(deriveEverstakePosition(account)).toMatchObject({ canClaim: false });
    });

    it('keeps large balances in plain decimal notation', () => {
        const account = ethereumAccount([
            everstakePool({
                autocompoundBalance: '1000000000000000000000',
                pendingBalance: '1000000000000000000000',
                pendingDepositedBalance: '2000000000000000000000',
                withdrawTotalAmount: '50000000000000000000000',
            }),
        ]);

        expect(deriveEverstakePosition(account)).toMatchObject({
            pendingStake: '3000',
            total: '54000',
        });
    });

    it('is null without a matching pool', () => {
        expect(deriveEverstakePosition(ethereumAccount([]))).toBeNull();
        expect(deriveEverstakePosition(ethereumAccount(undefined))).toBeNull();
        expect(
            deriveEverstakePosition(
                ethereumAccount([
                    everstakePool({ contract: '0x624087DD1904ab122A32878Ce9e933C7071F53B9' }),
                ]),
            ),
        ).toBeNull();
    });

    it('is null for a non-Ethereum account', () => {
        expect(
            deriveEverstakePosition(mockWalletAccount({ symbol: asNetworkSymbol('btc') })),
        ).toBeNull();
    });
});
