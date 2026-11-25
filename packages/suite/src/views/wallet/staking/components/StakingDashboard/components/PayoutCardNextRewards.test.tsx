import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { type StakingPosition, type StakingProductInfo } from '@suite-common/earn-staking-common';
import { mockStakingProductInfo } from '@suite-common/earn-staking-common/mocks';

import { PayoutCardNextRewards } from './PayoutCardNextRewards';
import {
    ZERO_BALANCES,
    amount,
    createStakingDashboardState,
    ethAccount,
    ethProduct,
    mockPosition,
    renderStakingDashboardComponent,
} from '../../stakingDashboardTestState';

const DAY_MS = 24 * 60 * 60 * 1000;
const ONE_ETH = '1000000000000000000';
const DAYS = '@staking/payout-card/days';

const stakedPosition = mockPosition(ethProduct.id, {
    balances: { ...ZERO_BALANCES, staked: amount(ONE_ETH) },
    operations: ['stake', 'unstake'],
});

// A first deposit still collecting in the pool, dated or not.
const pendingPosition = (availableAt: number | null): StakingPosition =>
    mockPosition(ethProduct.id, {
        status: 'activating',
        balances: { ...ZERO_BALANCES, pending: amount(ONE_ETH) },
        activations: [{ amount: amount(ONE_ETH), startedAt: null, availableAt }],
        operations: ['stake'],
    });

const inDays = (days: number) => Date.now() + days * DAY_MS;

const renderCard = (position: StakingPosition, productInfo?: StakingProductInfo) =>
    renderStakingDashboardComponent(<PayoutCardNextRewards account={ethAccount} />, {
        state: createStakingDashboardState({
            accounts: [ethAccount],
            positions: { [ethAccount.key]: [position] },
        }),
        productInfo: productInfo === undefined ? {} : { [ethProduct.id]: productInfo },
    });

describe('PayoutCardNextRewards', () => {
    it('shows a skeleton until the product info is cached', () => {
        const { container } = renderCard(stakedPosition);

        expect(container.querySelector('[data-component="Skeleton"]')).not.toBeNull();
        expect(screen.queryByTestId(DAYS)).not.toBeInTheDocument();
    });

    it('says N/A once the product info is cached without a next payout', () => {
        const { container } = renderCard(
            stakedPosition,
            mockStakingProductInfo({ nextRewardAt: null }),
        );

        expect(container.querySelector('[data-component="Skeleton"]')).toBeNull();
        expect(screen.getByTestId(DAYS)).toHaveTextContent('N/A');
    });

    it('dates the next payout for a stake that earns', () => {
        renderCard(stakedPosition, mockStakingProductInfo({ nextRewardAt: inDays(2) }));

        expect(screen.getByTestId(DAYS)).toHaveTextContent('2 days');
    });

    it('says N/A for a deposit whose activation cannot be dated', () => {
        renderCard(
            pendingPosition(null),
            mockStakingProductInfo({ nextRewardAt: inDays(2), entryPeriodDays: null }),
        );

        expect(screen.getByTestId(DAYS)).toHaveTextContent('N/A');
    });

    it('dates the first payout after the activation of a deposit', () => {
        renderCard(
            pendingPosition(inDays(10)),
            mockStakingProductInfo({ nextRewardAt: inDays(2), rewardPeriodDays: 7 }),
        );

        expect(screen.getByTestId(DAYS)).toHaveTextContent('16 days');
    });

    it('says N/A for a deposit activating after the next payout without a reward period', () => {
        renderCard(
            pendingPosition(inDays(10)),
            mockStakingProductInfo({ nextRewardAt: inDays(2), rewardPeriodDays: null }),
        );

        expect(screen.getByTestId(DAYS)).toHaveTextContent('N/A');
    });

    it('takes the next payout when the deposit activates before it', () => {
        renderCard(pendingPosition(inDays(1)), mockStakingProductInfo({ nextRewardAt: inDays(2) }));

        expect(screen.getByTestId(DAYS)).toHaveTextContent('2 days');
    });
});
