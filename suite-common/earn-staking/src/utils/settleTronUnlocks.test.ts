import { type StakingPositionUnlock, stakingAmountSchema } from '@suite-common/earn-staking-common';
import { mockStakingPosition } from '@suite-common/earn-staking-common/mocks';

import { settleTronUnlocks } from './settleTronUnlocks';

const NOW_MS = 1_700_000_000_000;
const HOUR_MS = 60 * 60 * 1000;

const sun = (value: string) => stakingAmountSchema.parse(value);

const matured: StakingPositionUnlock = { amount: sun('5000000'), availableAt: NOW_MS - 1 };
const pending: StakingPositionUnlock = { amount: sun('3000000'), availableAt: NOW_MS + HOUR_MS };
const undated: StakingPositionUnlock = { amount: sun('1000000'), availableAt: null };

const position = mockStakingPosition({
    balances: {
        staked: sun('10000000'),
        pending: sun('0'),
        unstaking: sun('9000000'),
        withdrawable: sun('2000000'),
        rewards: sun('0'),
    },
    unlocks: [matured, pending, undated],
});

describe('settleTronUnlocks', () => {
    it('moves the unlocks whose time has passed to the withdrawable amount', () => {
        expect(settleTronUnlocks({ position, nowMs: NOW_MS })).toEqual({
            unlocks: [pending, undated],
            unstaking: '4000000',
            withdrawable: '7000000',
        });
    });

    it('keeps the position as it is while no unlock has matured', () => {
        const settled = settleTronUnlocks({ position, nowMs: NOW_MS - HOUR_MS });

        expect(settled.unlocks).toBe(position.unlocks);
        expect(settled).toMatchObject({ unstaking: '9000000', withdrawable: '2000000' });
    });

    it('never counts the unstaking amount below zero', () => {
        const overdrawn = mockStakingPosition({
            balances: { ...position.balances, unstaking: sun('1000000') },
            unlocks: [matured],
        });

        expect(settleTronUnlocks({ position: overdrawn, nowMs: NOW_MS })).toMatchObject({
            unstaking: '0',
            withdrawable: '7000000',
        });
    });
});
