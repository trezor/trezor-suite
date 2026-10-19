import { useMemo } from 'react';

import { Translation } from '@suite/intl';
import { BACKUP_REWARD_PAYOUT_DAYS, getStakingDataForNetwork } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { secondsToDays } from '@suite-common/wallet-utils';
import { Paragraph } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { PayoutCard } from './PayoutCard';

interface PayoutCardNextRewardsProps {
    account: Account;
    nextRewardPayout?: number | null;
    daysToAddToPool?: number;
    validatorWithdrawTime?: number;
}

export const PayoutCardNextRewards = ({
    account,
    nextRewardPayout,
    daysToAddToPool,
    validatorWithdrawTime,
}: PayoutCardNextRewardsProps) => {
    const { autocompoundBalance = '0' } = getStakingDataForNetwork(account) ?? {};

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
