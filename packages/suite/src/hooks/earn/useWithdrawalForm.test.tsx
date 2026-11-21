import '@suite-common/test-utils/globalOverrides';

import { act } from '@testing-library/react';

import { type StakingDep } from '@suite-common/earn-staking';
import { mockStakingQueryClient, mockStakingServices } from '@suite-common/earn-staking/mocks';
import { type StakingPosition } from '@suite-common/earn-staking-common';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type Account } from '@suite-common/wallet-types';

import { renderHookWithProviders } from '#src/support/test-utils/hooksHelper';
import {
    adaAccount,
    adaEverstakeProduct,
    amount,
    createStakingDashboardState,
    ethAccount,
    ethProduct,
    mockPosition,
    solAccount,
    solProduct,
} from '#src/views/wallet/staking/components/stakingDashboardTestState';

import { useWithdrawalForm } from './useWithdrawalForm';
import { type MockSuiteState } from '../../../mocks/mockInitialAppState';

// The form's compose and fee handling reach the backend; the reads under test do not.
jest.mock('#src/hooks/wallet/form/useStakeCompose', () => ({
    useStakeCompose: () => ({
        isLoading: false,
        composeRequest: jest.fn(),
        composedLevels: undefined,
        onFeeLevelChange: jest.fn(),
    }),
}));
jest.mock('#src/hooks/wallet/form/useFees', () => ({
    useFees: () => ({ changeFeeLevel: jest.fn(), selectedFee: 'normal' }),
}));
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    simulateUnstake: jest.fn().mockResolvedValue(null),
}));

const zeroBalances = {
    staked: amount('0'),
    pending: amount('0'),
    unstaking: amount('0'),
    withdrawable: amount('0'),
    rewards: amount('0'),
};

const renderForm = (account: Account, position: StakingPosition | null) => {
    const { services } = createTestCompositionRoot<{ services: StakingDep }, MockSuiteState>({
        preloadedState: createStakingDashboardState({
            accounts: [account],
            positions: position === null ? {} : { [account.key]: [position] },
        }),
        services: () => ({ staking: mockStakingServices() }),
    });

    return renderHookWithProviders(services, () => useWithdrawalForm({ account }), {
        queryClient: mockStakingQueryClient(),
    });
};

describe('useWithdrawalForm', () => {
    it('lets an Ethereum position unstake its staked balance, restaked rewards included', () => {
        const { result } = renderForm(
            ethAccount,
            mockPosition(ethProduct.id, {
                balances: {
                    ...zeroBalances,
                    staked: amount('2012000000000000000'),
                    rewards: amount('12000000000000000'),
                },
                operations: ['stake', 'unstake'],
            }),
        );

        expect(result.current.unstakableBalance).toBe('2.012');
        expect(result.current.amountLimits).toEqual({
            currency: 'eth',
            maxCrypto: '2.012',
            maxFiat: '6036.00',
        });
        expect(result.current.getValues('cryptoInput')).toBe('2.012');
    });

    it('lets a Solana position unstake its active stake', () => {
        const { result } = renderForm(
            solAccount,
            mockPosition(solProduct.id, {
                balances: { ...zeroBalances, staked: amount('2500000000') },
                operations: ['stake', 'unstake'],
            }),
        );

        expect(result.current.unstakableBalance).toBe('2.5');
        expect(result.current.amountLimits.maxCrypto).toBe('2.5');
    });

    it('lets a Cardano delegation unstake the delegated balance, reward balance included', () => {
        const { result } = renderForm(
            adaAccount,
            mockPosition(adaEverstakeProduct.id, {
                lockup: 'liquid',
                balances: {
                    ...zeroBalances,
                    staked: amount('100056398'),
                    rewards: amount('56398'),
                },
                operations: ['unstake', 'claim', 'vote'],
            }),
        );

        expect(result.current.unstakableBalance).toBe('100.056398');
        expect(result.current.isCardanoBalanceEmpty).toBe(false);
    });

    it('blocks a Cardano unstake while nothing is spendable, whatever the reward balance', () => {
        const { result } = renderForm(
            { ...adaAccount, availableBalance: '0', formattedBalance: '0' },
            mockPosition(adaEverstakeProduct.id, {
                lockup: 'liquid',
                balances: { ...zeroBalances, staked: amount('56398'), rewards: amount('56398') },
                operations: ['unstake', 'claim', 'vote'],
            }),
        );

        expect(result.current.unstakableBalance).toBe('0.056398');
        expect(result.current.isCardanoBalanceEmpty).toBe(true);
    });

    it('offers nothing to unstake without a position', () => {
        const { result } = renderForm(ethAccount, null);

        expect(result.current.unstakableBalance).toBe('0');
        expect(result.current.amountLimits.maxCrypto).toBe('0');
    });

    it('sets a ratio of the staked balance', async () => {
        const { result } = renderForm(
            ethAccount,
            mockPosition(ethProduct.id, {
                balances: { ...zeroBalances, staked: amount('2000000000000000000') },
                operations: ['stake', 'unstake'],
            }),
        );

        await act(() => result.current.setRatioAmount(4));

        expect(result.current.getValues('cryptoInput')).toBe('0.5');
    });
});
