import { useMemo } from 'react';

import { BigNumber } from '@trezor/utils/src/bigNumber';
import { Card, Column, Icon, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { BACKUP_REWARD_PAYOUT_DAYS } from '@suite-common/wallet-constants';
import { getAccountAutocompoundBalance } from '@suite-common/wallet-utils';

import { Translation } from 'src/components/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { useSelector } from 'src/hooks/suite';

interface PayoutCardProps {
    nextRewardPayout?: number | null;
    daysToAddToPool?: number;
    validatorWithdrawTime?: number;
}

export const PayoutCard = ({
    nextRewardPayout,
    daysToAddToPool,
    validatorWithdrawTime,
}: PayoutCardProps) => {
    const selectedAccount = useSelector(selectSelectedAccount);

    const autocompoundBalance = getAccountAutocompoundBalance(selectedAccount);
    const payout = useMemo(() => {
        if (!nextRewardPayout || !daysToAddToPool) return undefined;

        if (new BigNumber(autocompoundBalance).gt(0) || daysToAddToPool <= nextRewardPayout) {
            return nextRewardPayout;
        }

        if (!validatorWithdrawTime) return undefined;

        return Math.round(validatorWithdrawTime / 60 / 60 / 24) + nextRewardPayout;
    }, [autocompoundBalance, daysToAddToPool, nextRewardPayout, validatorWithdrawTime]);

    return (
        <Card paddingType="small" flex="1">
            <Column alignItems="flex-start" flex="1" gap={spacings.lg}>
                <Icon name="calendar" variant="tertiary" />

                <Column alignItems="normal" margin={{ top: 'auto' }}>
                    <Paragraph typographyStyle="titleMedium">
                        {payout === undefined ? (
                            <Translation
                                id="TR_STAKE_MAX_REWARD_DAYS"
                                values={{ count: BACKUP_REWARD_PAYOUT_DAYS }}
                            />
                        ) : (
                            <Translation id="TR_STAKE_DAYS" values={{ count: payout }} />
                        )}
                    </Paragraph>
                    <Paragraph typographyStyle="hint" variant="tertiary">
                        <Translation id="TR_STAKE_NEXT_PAYOUT" />
                    </Paragraph>
                </Column>
            </Column>
        </Card>
    );
};
