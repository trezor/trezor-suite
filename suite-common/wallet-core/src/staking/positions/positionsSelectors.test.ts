import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type StakingPool } from '@trezor/blockchain-link-types';
import { EVERSTAKE_CONTRACTS } from '@trezor/network-ethereum/staking';

import {
    selectAccountHasStakingPosition,
    selectAccountStakingSummary,
    selectStakingPosition,
    selectStakingPositions,
} from './positionsSelectors';
import { type AccountsRootState } from '../../accounts/accountsReducer';

const ethSymbol = asNetworkSymbol('eth');

const pool: StakingPool = {
    name: 'Everstake',
    contract: EVERSTAKE_CONTRACTS[1].accounting,
    autocompoundBalance: '2050000000000000000',
    claimableAmount: '500000000000000000',
    depositedBalance: '2000000000000000000',
    pendingBalance: '100000000000000000',
    pendingDepositedBalance: '0',
    restakedReward: '50000000000000000',
    withdrawTotalAmount: '500000000000000000',
};

const stakingAccount = {
    ...mockWalletAccount({ symbol: ethSymbol, descriptor: asAccountDescriptor('eth1') }),
    networkType: 'ethereum',
    misc: { nonce: '0', stakingPools: [pool] },
} as Account;

const idleAccount = {
    ...mockWalletAccount({ symbol: ethSymbol, descriptor: asAccountDescriptor('eth2') }),
    networkType: 'ethereum',
    misc: { nonce: '0' },
} as Account;

const createState = (accounts: Account[]): AccountsRootState => ({ wallet: { accounts } });

describe(selectStakingPositions.name, () => {
    it('selects the positions of the account', () => {
        const positions = selectStakingPositions(
            createState([stakingAccount, idleAccount]),
            stakingAccount.key,
        );

        expect(positions).toHaveLength(1);
        expect(positions[0]).toMatchObject({
            providerId: 'everstake',
            accountKey: stakingAccount.key,
        });
    });

    it('is empty for an account without positions and for an unknown account', () => {
        const state = createState([idleAccount]);

        expect(selectStakingPositions(state, idleAccount.key)).toEqual([]);
        expect(selectStakingPositions(state, stakingAccount.key)).toEqual([]);
    });

    it('keeps the reference while the account object is unchanged', () => {
        const first = selectStakingPositions(createState([stakingAccount]), stakingAccount.key);
        const second = selectStakingPositions(createState([stakingAccount]), stakingAccount.key);

        expect(second).toBe(first);
    });
});

describe(selectStakingPosition.name, () => {
    it('selects the position of one provider', () => {
        const state = createState([stakingAccount]);

        expect(selectStakingPosition(state, stakingAccount.key, 'everstake')).toMatchObject({
            staked: '2',
        });
        expect(selectStakingPosition(state, stakingAccount.key, 'luganodes')).toBeNull();
    });
});

describe(selectAccountHasStakingPosition.name, () => {
    it('is true only for accounts with a position', () => {
        const state = createState([stakingAccount, idleAccount]);

        expect(selectAccountHasStakingPosition(state, stakingAccount.key)).toBe(true);
        expect(selectAccountHasStakingPosition(state, idleAccount.key)).toBe(false);
    });
});

describe(selectAccountStakingSummary.name, () => {
    it('sums the positions of the account', () => {
        expect(
            selectAccountStakingSummary(createState([stakingAccount]), stakingAccount.key),
        ).toEqual({
            staked: '2',
            pendingStake: '0.1',
            unstaking: '0.5',
            claimable: '0.5',
            rewards: '0.05',
            canClaim: true,
            total: '2.65',
        });
    });

    it('is the zero summary without positions, with the same reference every time', () => {
        const state = createState([idleAccount]);

        const summary = selectAccountStakingSummary(state, idleAccount.key);

        expect(summary).toEqual({
            staked: '0',
            pendingStake: '0',
            unstaking: '0',
            claimable: '0',
            rewards: null,
            canClaim: false,
            total: '0',
        });
        expect(selectAccountStakingSummary(createState([idleAccount]), idleAccount.key)).toBe(
            summary,
        );
    });
});
