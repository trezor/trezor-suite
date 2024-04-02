import { useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { useTheme } from 'styled-components';
import { Icon } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { AccentP, CardBottomContent, GreyP, StyledCard } from './styled';
import { getAccountAutocompoundBalance } from 'src/utils/wallet/stakingUtils';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { useSelector } from 'src/hooks/suite';

interface PayoutCardProps {
    nextRewardPayout: number | null;
    daysToAddToPool: number;
    validatorWithdrawTime: number;
}

export const PayoutCard = ({
    nextRewardPayout,
    daysToAddToPool,
    validatorWithdrawTime,
}: PayoutCardProps) => {
    const theme = useTheme();
    const selectedAccount = useSelector(selectSelectedAccount);

    const autocompoundBalance = getAccountAutocompoundBalance(selectedAccount);
    const payout = useMemo(() => {
        if (!nextRewardPayout || !daysToAddToPool) return '--';

        if (new BigNumber(autocompoundBalance).gt(0) || daysToAddToPool <= nextRewardPayout) {
            return nextRewardPayout;
        }

        if (!validatorWithdrawTime) return '--';

        return Math.round(validatorWithdrawTime / 60 / 60 / 24) + nextRewardPayout;
    }, [autocompoundBalance, daysToAddToPool, nextRewardPayout, validatorWithdrawTime]);

    return (
        <StyledCard>
            <Icon icon="CALENDAR_THIN" color={theme.iconSubdued} />

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
