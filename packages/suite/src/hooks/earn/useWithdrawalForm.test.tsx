import '@suite-common/test-utils/globalOverrides';

import { type Reducer } from '@reduxjs/toolkit';
import { act, waitFor } from '@testing-library/react';

import { type StakingDep, stakingActions, stakingReducer } from '@suite-common/earn-staking';
import { mockStakingQueryClient, mockStakingServices } from '@suite-common/earn-staking/mocks';
import { type StakingPosition } from '@suite-common/earn-staking-common';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { simulateUnstake } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { createDeferred } from '@trezor/utils';

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

const stakedEthPosition = (staked: string) =>
    mockPosition(ethProduct.id, {
        balances: { ...zeroBalances, staked: amount(staked) },
        operations: ['stake', 'unstake'],
    });

// The position syncs must reach the staking slice; the rest of the state stays.
const renderFormWithPositionSync = (staked: string) => {
    const initialState = createStakingDashboardState({
        accounts: [ethAccount],
        positions: { [ethAccount.key]: [stakedEthPosition(staked)] },
    });
    const reducer: Reducer<MockSuiteState> = (state = initialState, action) => ({
        ...state,
        earn: { ...state.earn, staking: stakingReducer(state.earn.staking, action) },
    });
    const { services } = createTestCompositionRoot<{ services: StakingDep }, MockSuiteState>({
        preloadedState: initialState,
        reducer,
        services: () => ({ staking: mockStakingServices() }),
    });
    const rendered = renderHookWithProviders(
        services,
        () => useWithdrawalForm({ account: ethAccount }),
        { queryClient: mockStakingQueryClient() },
    );

    const syncStakedBalance = (nextStaked: string) =>
        act(() => {
            services.store.dispatch(
                stakingActions.positionsSynced({
                    accountKey: ethAccount.key,
                    positions: [stakedEthPosition(nextStaked)],
                }),
            );
        });

    return { ...rendered, syncStakedBalance };
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

    it('keeps a typed amount when the account object updates with the same values', async () => {
        const position = mockPosition(ethProduct.id, {
            balances: { ...zeroBalances, staked: amount('2000000000000000000') },
            operations: ['stake', 'unstake'],
        });
        const { services } = createTestCompositionRoot<{ services: StakingDep }, MockSuiteState>({
            preloadedState: createStakingDashboardState({
                accounts: [ethAccount],
                positions: { [ethAccount.key]: [position] },
            }),
            services: () => ({ staking: mockStakingServices() }),
        });
        const { result, rerender } = renderHookWithProviders(
            services,
            ({ account }: { account: Account }) => useWithdrawalForm({ account }),
            { queryClient: mockStakingQueryClient(), initialProps: { account: ethAccount } },
        );

        await act(() => result.current.setRatioAmount(4));
        expect(result.current.getValues('cryptoInput')).toBe('0.5');

        rerender({ account: { ...ethAccount } });

        expect(result.current.getValues('cryptoInput')).toBe('0.5');
    });

    it('keeps a typed amount when the staked balance changes', async () => {
        const { result, syncStakedBalance } = renderFormWithPositionSync('2000000000000000000');

        await act(() => result.current.setRatioAmount(4));
        expect(result.current.getValues('cryptoInput')).toBe('0.5');

        await syncStakedBalance('2010000000000000000');

        expect(result.current.unstakableBalance).toBe('2.01');
        expect(result.current.getValues('cryptoInput')).toBe('0.5');
        expect(result.current.getValues('outputs.0.amount')).toBe('0.5');
    });

    it('follows the staked balance while nothing was typed', async () => {
        const { result, syncStakedBalance } = renderFormWithPositionSync('2000000000000000000');

        await syncStakedBalance('3000000000000000000');

        expect(result.current.getValues('cryptoInput')).toBe('3');
        expect(result.current.getValues('outputs.0.amount')).toBe('3');
    });

    describe('instant Ethereum unstake estimate', () => {
        const mockSimulateUnstake = jest.mocked(simulateUnstake);

        afterEach(() => {
            mockSimulateUnstake.mockReset().mockResolvedValue(null);
        });

        it('clears the previous estimate when the simulation fails and shows a later estimate', async () => {
            mockSimulateUnstake.mockImplementation(({ amount: requestedAmount }) => {
                if (requestedAmount === '2') return Promise.resolve('0.75');
                if (requestedAmount === '0.5') {
                    return Promise.reject(new Error('execution reverted'));
                }

                return Promise.resolve('0.25');
            });
            const { result } = renderForm(ethAccount, stakedEthPosition('2000000000000000000'));

            await waitFor(() => expect(result.current.approximatedInstantEthAmount).toBe('0.75'));

            await act(() => result.current.setRatioAmount(4));

            expect(result.current.approximatedInstantEthAmount).toBeNull();

            await act(() => result.current.setRatioAmount(2));

            expect(result.current.approximatedInstantEthAmount).toBe('0.25');
        });

        it('keeps the estimate for the latest amount when an older simulation finishes late', async () => {
            const older = createDeferred<string>();
            mockSimulateUnstake.mockImplementation(({ amount: requestedAmount }) =>
                requestedAmount === '2' ? older.promise : Promise.resolve('0.25'),
            );
            const { result } = renderForm(ethAccount, stakedEthPosition('2000000000000000000'));

            await act(() => result.current.setRatioAmount(2));
            expect(result.current.approximatedInstantEthAmount).toBe('0.25');

            await act(async () => {
                older.resolve('0.75');
                await older.promise;
            });

            expect(result.current.approximatedInstantEthAmount).toBe('0.25');
        });
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
