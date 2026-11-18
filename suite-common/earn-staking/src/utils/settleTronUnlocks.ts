import {
    type StakingAmount,
    type StakingPosition,
    type StakingPositionUnlock,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import { BigNumber } from '@trezor/utils';

export const TRON_UNLOCKS_REFRESH_INTERVAL_MS = 60 * 1000;

export type SettledTronUnlocks = {
    unlocks: readonly StakingPositionUnlock[];
    unstaking: StakingAmount;
    withdrawable: StakingAmount;
};

type SettleTronUnlocksParams = {
    position: StakingPosition;
    nowMs: number;
};

const toStakingAmount = (value: BigNumber): StakingAmount =>
    stakingAmountSchema.parse(value.toFixed(0));

// A Tron unlock matures by time alone, so one synced before its time counts as withdrawable here
// until the next sync, as the legacy cards split the batches at the current minute.
export const settleTronUnlocks = ({
    position,
    nowMs,
}: SettleTronUnlocksParams): SettledTronUnlocks => {
    const matured = position.unlocks.filter(
        ({ availableAt }) => availableAt !== null && availableAt <= nowMs,
    );

    if (matured.length === 0) {
        const { unlocks, balances } = position;
        const { unstaking, withdrawable } = balances;

        return { unlocks, unstaking, withdrawable };
    }

    const maturedAmount = BigNumber.sum(0, ...matured.map(({ amount }) => amount));

    const unlocks = position.unlocks.filter(unlock => !matured.includes(unlock));
    const unstaking = toStakingAmount(
        BigNumber.max(new BigNumber(position.balances.unstaking).minus(maturedAmount), 0),
    );
    const withdrawable = toStakingAmount(
        new BigNumber(position.balances.withdrawable).plus(maturedAmount),
    );

    return { unlocks, unstaking, withdrawable };
};
