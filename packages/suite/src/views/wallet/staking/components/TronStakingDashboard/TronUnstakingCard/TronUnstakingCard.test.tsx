import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { type StakingPositionUnlock } from '@suite-common/earn-staking-common';
import { BigNumber } from '@trezor/utils';

import { TronUnstakingCard } from './TronUnstakingCard';
import {
    TRON_DETAILS,
    amount,
    createStakingDashboardState,
    mockPosition,
    renderStakingDashboardComponent,
    trxAccount,
    trxProduct,
} from '../../stakingDashboardTestState';

const TRX = 1_000_000;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const NOW_MS = 1_700_000_000_000;

const sun = (value: number | string) => amount(String(value));

const renderCard = (unlocks: StakingPositionUnlock[]) => {
    const unstaking = amount(BigNumber.sum(0, ...unlocks.map(unlock => unlock.amount)).toFixed(0));

    return renderStakingDashboardComponent(
        <TronUnstakingCard account={trxAccount} nowMs={NOW_MS} />,
        {
            state: createStakingDashboardState({
                accounts: [trxAccount],
                positions: {
                    [trxAccount.key]: [
                        mockPosition(trxProduct.id, {
                            balances: {
                                staked: sun(0),
                                pending: sun(0),
                                unstaking,
                                withdrawable: unlocks.length === 0 ? sun(5 * TRX) : sun(0),
                                rewards: sun(0),
                            },
                            unlocks,
                            details: TRON_DETAILS,
                        }),
                    ],
                },
            }),
        },
    );
};

describe('TronUnstakingCard', () => {
    beforeEach(() => {
        jest.useFakeTimers({ legacyFakeTimers: false, now: NOW_MS });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('starts collapsed with the pending total', () => {
        renderCard([
            { amount: sun(50 * TRX), availableAt: NOW_MS + 13 * DAY_MS - 60_000 },
            { amount: sun(100 * TRX), availableAt: NOW_MS + 6 * DAY_MS + 5 * HOUR_MS },
        ]);

        expect(screen.getByTestId('@staking/tron-unstaking-card/amount')).toHaveTextContent(
            '150 TRX',
        );
        expect(screen.queryByTestId('@staking/tron-unstaking-card/row-0')).not.toBeInTheDocument();
    });

    it('lists each pending unlock with the time left once expanded', async () => {
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

        renderCard([
            { amount: sun(100 * TRX), availableAt: NOW_MS + 6 * DAY_MS + 5 * HOUR_MS },
            { amount: sun(50 * TRX), availableAt: NOW_MS + 13 * DAY_MS - 60_000 },
        ]);

        await user.click(screen.getByTestId('@staking/tron-unstaking-card/toggle'));

        expect(screen.getByTestId('@staking/tron-unstaking-card/row-0/amount')).toHaveTextContent(
            '100 TRX',
        );
        expect(
            screen.getByTestId('@staking/tron-unstaking-card/row-0/time-left'),
        ).toHaveTextContent(/6 days/);
        expect(screen.getByTestId('@staking/tron-unstaking-card/row-1/amount')).toHaveTextContent(
            '50 TRX',
        );
        expect(
            screen.getByTestId('@staking/tron-unstaking-card/row-1/time-left'),
        ).toHaveTextContent(/12 days/);
    });

    it('settles an unlock whose time has passed out of the pending list', async () => {
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

        renderCard([
            { amount: sun(10 * TRX), availableAt: NOW_MS - HOUR_MS },
            { amount: sun(20 * TRX), availableAt: NOW_MS + 2 * DAY_MS },
        ]);

        expect(screen.getByTestId('@staking/tron-unstaking-card/amount')).toHaveTextContent(
            '20 TRX',
        );

        await user.click(screen.getByTestId('@staking/tron-unstaking-card/toggle'));

        expect(screen.getByTestId('@staking/tron-unstaking-card/row-0/amount')).toHaveTextContent(
            '20 TRX',
        );
        expect(screen.queryByTestId('@staking/tron-unstaking-card/row-1')).not.toBeInTheDocument();
    });

    it('renders nothing when the position has no pending unlock', () => {
        renderCard([]);

        expect(
            screen.queryByTestId('@staking/tron-unstaking-card/container'),
        ).not.toBeInTheDocument();
    });
});
