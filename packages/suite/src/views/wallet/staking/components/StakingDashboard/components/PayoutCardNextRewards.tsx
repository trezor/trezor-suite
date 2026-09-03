import { useMemo } from 'react';

import { selectSelectedAccount } from '@suite/account';
import { Translation } from '@suite/intl';
import { BACKUP_REWARD_PAYOUT_DAYS, getStakingDataForNetwork } from '@suite-common/wallet-core';
import { secondsToDays } from '@suite-common/wallet-utils';
import { Paragraph } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';

import { PayoutCard } from './PayoutCard';

interface PayoutCardNextRewardsProps {
    nextRewardPayout?: number | null;
    daysToAddToPool?: number;
    validatorWithdrawTime?: number;
}

export const PayoutCardNextRewards = ({
    nextRewardPayout,
    daysToAddToPool,
    validatorWithdrawTime,
}: PayoutCardNextRewardsProps) => {
    const selectedAccount = useSelector(selectSelectedAccount);

    const { autocompoundBalance = '0' } = getStakingDataForNetwork(selectedAccount) ?? {};

    const payout = useMemo(() => {
        if (!nextRewardPayout || !daysToAddToPool) return undefined;

        if (new BigNumber(autocompoundBalance).gt(0) || daysToAddToPool <= nextRewardPayout) {
            return nextRewardPayout;
        }

        if (!validatorWithdrawTime) return undefined;

        return secondsToDays(validatorWithdrawTime) + nextRewardPayout;
    }, [autocompoundBalance, daysToAddToPool, nextRewardPayout, validatorWithdrawTime]);

    return (
        <PayoutCard>
            <>
                <Paragraph typographyStyle="headline-md">
                    {payout === undefined ? (
                        <Translation
                            id="TR_STAKE_MAX_REWARD_DAYS"
                            values={{ count: BACKUP_REWARD_PAYOUT_DAYS }}
                        />
                    ) : (
                        <Translation id="TR_STAKE_DAYS" values={{ count: payout }} />
                    )}
                </Paragraph>
                <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                    <Translation id="TR_STAKE_NEXT_PAYOUT" />
                </Paragraph>
            </>
        </PayoutCard>
    );
};
