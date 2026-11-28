import {
    formatStakingAmount,
    selectStakingAccountPositionEntry,
    settleTronUnlocks,
} from '@suite-common/earn-staking';
import { type Account } from '@suite-common/wallet-types';

import { UnstakingCard } from '#src/components/earn/staking/UnstakingCard';
import { useSelector } from '#src/hooks/suite/useSelector';

const TEST_ID = '@staking/tron-unstaking-card';

type TronUnstakingCardProps = {
    account: Account;
    nowMs: number;
};

export const TronUnstakingCard = ({ account, nowMs }: TronUnstakingCardProps) => {
    const position = useSelector(
        state => selectStakingAccountPositionEntry(state, account.key)?.position ?? null,
    );

    if (position === null) return null;

    const { unlocks, unstaking } = settleTronUnlocks({ position, nowMs });

    if (unlocks.length === 0) return null;

    const pendingBalance = formatStakingAmount({
        amount: unstaking,
        networkSymbol: account.symbol,
    });

    return (
        <UnstakingCard
            testId={TEST_ID}
            symbol={account.symbol}
            amount={pendingBalance}
            rows={unlocks.map(({ amount, availableAt }, index) => ({
                testId: `${TEST_ID}/row-${index}`,
                amount: formatStakingAmount({ amount, networkSymbol: account.symbol }),
                availableAt,
            }))}
        />
    );
};
