import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type EthereumStakingScenario,
    mockEthereumStakingAccount,
} from '@suite-common/wallet-types/mocks';

import {
    selectEthereumNextRewardPayout,
    selectEthereumValidatorsQueue,
    selectUnstakingPeriodInDaysBySymbol,
} from './ethereumStakingSelectors';
import { hasStakeInPendingDepositedState } from './ethereumStakingUtils';
import { mockStakeData, mockStakeRootState } from '../../../mocks';

describe('ethereum staking details characterization', () => {
    it.each<{ scenario: EthereumStakingScenario; expected: boolean }>([
        { scenario: 'none', expected: false },
        { scenario: 'pending', expected: false },
        { scenario: 'pendingDeposited', expected: true },
        { scenario: 'active', expected: false },
        { scenario: 'unstaking', expected: false },
        { scenario: 'claimable', expected: false },
        { scenario: 'partiallyClaimable', expected: false },
        { scenario: 'otherPool', expected: false },
    ])('$scenario stake in pending deposited state', ({ scenario, expected }) => {
        expect(hasStakeInPendingDepositedState(mockEthereumStakingAccount(scenario))).toBe(
            expected,
        );
    });

    it('reads reward payout and validators queue from staking API data', () => {
        const state = mockStakeRootState({ accounts: [] });

        expect({
            nextRewardPayout: selectEthereumNextRewardPayout(state),
            validatorsQueue: selectEthereumValidatorsQueue(state),
        }).toEqual({
            nextRewardPayout: 5,
            validatorsQueue: mockStakeData().eth?.validators,
        });
    });

    it('falls back without staking API data', () => {
        const state = mockStakeRootState({
            accounts: [],
            stakeData: { ...mockStakeData(), eth: undefined },
        });

        expect({
            nextRewardPayout: selectEthereumNextRewardPayout(state),
            unstakingPeriodInDays: selectUnstakingPeriodInDaysBySymbol(
                state,
                asNetworkSymbol('eth'),
            ),
        }).toEqual({ nextRewardPayout: null, unstakingPeriodInDays: 3 });
    });

    it.each([
        { symbol: 'eth', expected: 3 },
        { symbol: 'thod', expected: 3 },
        { symbol: 'sol', expected: 1 },
        { symbol: 'ada', expected: 5 },
        { symbol: 'trx', expected: 14 },
        { symbol: 'btc', expected: 3 },
    ])('$symbol unstaking period in days', ({ symbol, expected }) => {
        const state = mockStakeRootState({ accounts: [] });

        expect(selectUnstakingPeriodInDaysBySymbol(state, asNetworkSymbol(symbol))).toBe(expected);
    });
});
