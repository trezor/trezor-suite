import {
    TRON_UNLOCKS_REFRESH_INTERVAL_MS,
    formatStakingAmount,
    settleTronUnlocks,
    useStakingAccountPosition,
} from '@suite-common/earn-staking';
import { stakingAmountSchema } from '@suite-common/earn-staking-common';
import { type Account } from '@suite-common/wallet-types';
import { useNow } from '@trezor/react-utils';

const ZERO_STAKING_AMOUNT = stakingAmountSchema.parse('0');

// An unlock matures by time alone, so the page settles the position at the current minute, as the
// dashboard banner that leads to it does.
export const useTronWithdrawableAmount = (account: Account): string => {
    const { position } = useStakingAccountPosition(account.key);

    const nowMs = useNow(TRON_UNLOCKS_REFRESH_INTERVAL_MS);

    const withdrawable =
        position === null
            ? ZERO_STAKING_AMOUNT
            : settleTronUnlocks({ position, nowMs }).withdrawable;

    return formatStakingAmount({ amount: withdrawable, networkSymbol: account.symbol });
};
