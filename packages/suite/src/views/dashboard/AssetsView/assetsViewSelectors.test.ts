import { type StakingPosition } from '@suite-common/earn-staking-common';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import {
    ADA,
    ETH,
    adaEverstakeProduct,
    amount,
    createStakingDashboardState,
    ethProduct,
    mockPosition,
} from '#src/views/wallet/staking/components/stakingDashboardTestState';

import { selectDashboardAssetStakingAmount } from './assetsViewSelectors';

const ethAccount = (index: number) =>
    mockWalletAccount({ symbol: ETH, index, descriptor: `eth_${index}` as Account['descriptor'] });

const lockedStake = (staked: string, pending = '0', overrides: Partial<StakingPosition> = {}) =>
    mockPosition(ethProduct.id, {
        balances: {
            staked: amount(staked),
            pending: amount(pending),
            unstaking: amount('0'),
            withdrawable: amount('0'),
            rewards: amount('0'),
        },
        operations: ['stake', 'unstake'],
        ...overrides,
    });

describe('selectDashboardAssetStakingAmount', () => {
    it('sums what the active locked positions of the network hold', () => {
        const first = ethAccount(0);
        const second = ethAccount(1);
        const state = createStakingDashboardState({
            accounts: [first, second],
            positions: {
                [first.key]: [lockedStake('2000000000000000000')],
                [second.key]: [lockedStake('1000000000000000000', '500000000000000000')],
            },
        });

        expect(selectDashboardAssetStakingAmount(state, ETH)).toBe('3.5');
    });

    it('leaves a liquid Cardano delegation out, as the row always did', () => {
        const account = mockWalletAccount({ symbol: ADA });
        const state = createStakingDashboardState({
            accounts: [account],
            positions: {
                [account.key]: [
                    mockPosition(adaEverstakeProduct.id, {
                        lockup: 'liquid',
                        balances: {
                            staked: amount('100000000'),
                            pending: amount('0'),
                            unstaking: amount('0'),
                            withdrawable: amount('0'),
                            rewards: amount('0'),
                        },
                        operations: ['unstake', 'claim', 'vote'],
                    }),
                ],
            },
        });

        expect(selectDashboardAssetStakingAmount(state, ADA)).toBe('0');
    });

    it('leaves an inactive pool entry out', () => {
        const account = ethAccount(0);
        const state = createStakingDashboardState({
            accounts: [account],
            positions: {
                [account.key]: [
                    lockedStake('0', '0', { status: 'inactive', operations: ['stake'] }),
                ],
            },
        });

        expect(selectDashboardAssetStakingAmount(state, ETH)).toBe('0');
    });

    it('answers zero for a network without positions', () => {
        const state = createStakingDashboardState({ accounts: [ethAccount(0)] });

        expect(selectDashboardAssetStakingAmount(state, ETH)).toBe('0');
    });
});
