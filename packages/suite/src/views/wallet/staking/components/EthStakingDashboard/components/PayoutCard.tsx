import { useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { Icon, useTheme } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { selectSelectedAccountEverstakeStakingPool } from 'src/reducers/wallet/selectedAccountReducer';
import { AccentP, CardBottomContent, GreyP, StyledCard } from './styled';

interface PayoutCardProps {
    nextRewardPayout: number | null;
    daysToAddToPool: number;
}

export const PayoutCard = ({ nextRewardPayout, daysToAddToPool }: PayoutCardProps) => {
    const theme = useTheme();
    const { totalPendingStakeBalance = '0' } =
        useSelector(selectSelectedAccountEverstakeStakingPool) ?? {};
    const isStakePending = new BigNumber(totalPendingStakeBalance).gt(0);

    const payout = useMemo(() => {
        if (!isStakePending) return nextRewardPayout || '--';

        if (nextRewardPayout !== null && !Number.isNaN(daysToAddToPool)) {
            if (daysToAddToPool <= nextRewardPayout) return nextRewardPayout;

            return daysToAddToPool + nextRewardPayout;
        }

        return '--';
    }, [daysToAddToPool, isStakePending, nextRewardPayout]);

    return (
        <StyledCard>
            <Icon icon="CALENDAR_THIN" color={theme.TYPE_LIGHT_GREY} />

            <CardBottomContent>
                <AccentP>
                    <Translation id="TR_STAKE_DAYS" values={{ days: payout }} />
                </AccentP>
                <GreyP>
                    <Translation id="TR_STAKE_NEXT_PAYOUT" />
                </GreyP>
            </CardBottomContent>
        </StyledCard>
    );
};
