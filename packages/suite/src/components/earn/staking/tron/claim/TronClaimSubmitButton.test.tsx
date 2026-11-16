import '@suite-common/test-utils/globalOverrides';

import { act, screen } from '@testing-library/react';

import { type StakingPosition } from '@suite-common/earn-staking-common';

import {
    TRON_DETAILS,
    ZERO_BALANCES,
    amount,
    createStakingDashboardState,
    mockPosition,
    renderStakingDashboardComponent,
    trxAccount,
    trxProduct,
} from '#src/views/wallet/staking/components/stakingDashboardTestState';

import { TronClaimSubmitButton } from './TronClaimSubmitButton';
import { useTronStakeContext } from '../TronStakeContext';

jest.mock('../TronStakeContext', () => ({ useTronStakeContext: jest.fn() }));

const NOW_MS = 1_700_000_000_000;
const HOUR_MS = 60 * 60 * 1000;
const CONTINUE_BUTTON = '@staking/tron-claim/continue-button';

const submitAction = jest.fn();

const rewardsPosition = (rewardClaimAvailableAt: number | null): StakingPosition =>
    mockPosition(trxProduct.id, {
        balances: { ...ZERO_BALANCES, staked: amount('100000000'), rewards: amount('1000000') },
        operations: ['stake', 'unstake', 'vote', 'claim'],
        details: { ...TRON_DETAILS, rewardClaimAvailableAt },
    });

const renderButton = (position: StakingPosition) =>
    renderStakingDashboardComponent(<TronClaimSubmitButton />, {
        state: createStakingDashboardState({
            accounts: [trxAccount],
            positions: { [trxAccount.key]: [position] },
        }),
    });

describe('TronClaimSubmitButton', () => {
    beforeEach(() => {
        jest.useFakeTimers({ legacyFakeTimers: false });
        jest.setSystemTime(NOW_MS);
        jest.mocked(useTronStakeContext).mockReturnValue({
            account: trxAccount,
            actions: { isSubmitting: false, pendingTxid: null, submitAction },
            fees: { composedLevels: { normal: { type: 'final' } } },
        } as unknown as ReturnType<typeof useTronStakeContext>);
    });

    afterEach(() => {
        jest.useRealTimers();
        submitAction.mockReset();
    });

    it('continues with rewards and no cooldown', () => {
        renderButton(rewardsPosition(null));

        expect(screen.getByTestId(CONTINUE_BUTTON)).toBeEnabled();
    });

    it('waits while the rewards are on their claim cooldown', () => {
        renderButton(rewardsPosition(NOW_MS + HOUR_MS));

        expect(screen.getByTestId(CONTINUE_BUTTON)).toBeDisabled();
    });

    it('continues again once the cooldown passes, before the position is synced', () => {
        renderButton(rewardsPosition(NOW_MS + 2_000));

        expect(screen.getByTestId(CONTINUE_BUTTON)).toBeDisabled();

        act(() => {
            jest.advanceTimersByTime(3_000);
        });

        expect(screen.getByTestId(CONTINUE_BUTTON)).toBeEnabled();
    });

    it('waits without rewards', () => {
        renderButton(
            mockPosition(trxProduct.id, {
                balances: { ...ZERO_BALANCES, staked: amount('100000000') },
                operations: ['stake', 'unstake', 'vote'],
                details: TRON_DETAILS,
            }),
        );

        expect(screen.getByTestId(CONTINUE_BUTTON)).toBeDisabled();
    });
});
