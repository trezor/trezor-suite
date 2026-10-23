import { LUGANODES_TRON_SRS, asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type StakingPool } from '@trezor/blockchain-link-types';
import { EVERSTAKE_CONTRACTS } from '@trezor/network-ethereum/staking';

import { deriveStakingPositions } from './deriveStakingPositions';

const pool: StakingPool = {
    name: 'Everstake',
    contract: EVERSTAKE_CONTRACTS[560048].accounting,
    autocompoundBalance: '1000000000000000000',
    claimableAmount: '0',
    depositedBalance: '1000000000000000000',
    pendingBalance: '0',
    pendingDepositedBalance: '0',
    restakedReward: '0',
    withdrawTotalAmount: '0',
};

const hoodiAccount = (stakingPools: StakingPool[]): Account =>
    ({
        ...mockWalletAccount({ symbol: asNetworkSymbol('thod') }),
        networkType: 'ethereum',
        misc: { nonce: '0', stakingPools },
    }) as Account;

describe(deriveStakingPositions.name, () => {
    it('derives one position per product the account has a pool with', () => {
        const positions = deriveStakingPositions(hoodiAccount([pool]));

        expect(positions).toHaveLength(1);
        expect(positions[0]).toMatchObject({
            productId: 'thod:thod:everstake:pooled',
            providerId: 'everstake',
            staked: '1',
        });
    });

    it('derives the positions of other networks through their adapters', () => {
        const [luganodesSr = ''] = LUGANODES_TRON_SRS;
        const tronAccount = {
            ...mockWalletAccount({ symbol: asNetworkSymbol('trx') }),
            networkType: 'tron',
            misc: {
                tronResources: {
                    stakingInfo: {
                        stakedBalance: '5000000',
                        unstakingBatches: [],
                        votes: [{ address: luganodesSr, voteCount: '5' }],
                        unclaimedReward: '0',
                    },
                },
            },
        } as unknown as Account;

        expect(deriveStakingPositions(tronAccount)).toEqual([
            expect.objectContaining({ productId: 'trx:trx:luganodes:native', staked: '5' }),
        ]);
    });

    it('keeps the same references for the same account object', () => {
        const account = hoodiAccount([pool]);

        const first = deriveStakingPositions(account);
        const second = deriveStakingPositions(account);

        expect(second).toBe(first);
        expect(second[0]).toBe(first[0]);
    });

    it('returns the shared empty array when the account has no position', () => {
        const withoutPools = deriveStakingPositions(hoodiAccount([]));
        const bitcoin = deriveStakingPositions(
            mockWalletAccount({ symbol: asNetworkSymbol('btc') }),
        );

        expect(withoutPools).toEqual([]);
        expect(bitcoin).toBe(withoutPools);
    });

    it('reports a pool no product claims instead of silently returning no position', () => {
        const error = jest.spyOn(console, 'error').mockImplementation(() => {});
        const unknownContract = '0x624087DD1904ab122A32878Ce9e933C7071F53B9';

        const positions = deriveStakingPositions(
            hoodiAccount([{ ...pool, contract: unknownContract }]),
        );

        expect(positions).toEqual([]);
        expect(error).toHaveBeenCalledWith(expect.stringContaining(unknownContract));

        error.mockRestore();
    });

    it('does not report an account without pools', () => {
        const error = jest.spyOn(console, 'error').mockImplementation(() => {});

        deriveStakingPositions(hoodiAccount([]));

        expect(error).not.toHaveBeenCalled();

        error.mockRestore();
    });
});
