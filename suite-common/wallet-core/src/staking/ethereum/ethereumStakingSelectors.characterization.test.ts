import {
    type EthereumStakingScenario,
    mockEthereumStakingAccount,
} from '@suite-common/wallet-types/mocks';

import { hasStakeInPendingDepositedState } from './ethereumStakingUtils';

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
});
