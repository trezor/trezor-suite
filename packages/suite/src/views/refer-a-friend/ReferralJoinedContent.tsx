import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';

import {
    type ReferralProgram,
    fetchReferralAccountThunk,
    getReferralRewardsSummary,
    selectReferralAccountState,
} from '@suite-common/refer-a-friend';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { ReferralError } from './ReferralError';
import { ReferralLinkCard } from './ReferralLinkCard';
import { ReferralLoading } from './ReferralLoading';
import { ReferralRewards } from './ReferralRewards';
import { ReferralRewardsKeyMissing } from './ReferralRewardsKeyMissing';
import { useReferralActions } from './useReferralActions';

type ReferralJoinedContentProps = {
    deviceId: string;
    shareUrl: string;
    program: ReferralProgram;
    annualRewardLimit: number;
};

export const ReferralJoinedContent = ({
    deviceId,
    shareUrl,
    program,
    annualRewardLimit,
}: ReferralJoinedContentProps) => {
    const accountState = useSelector(selectReferralAccountState);

    const { dispatch } = useServices(injectDispatch);
    const { formatNumber, formatDate } = useIntl();
    const { deriveKey } = useReferralActions();

    const { account, vouchers } = accountState;
    const redemptionLimit = account?.redemptionLimit ?? program.redemptionLimit;
    const redemptionCount = account?.redemptionCount ?? 0;
    const formatAmount = (amount: number) =>
        formatNumber(amount, {
            style: 'currency',
            currency: program.fiatCurrency,
            maximumFractionDigits: 0,
        });
    const { totalEarned } = getReferralRewardsSummary(vouchers ?? []);
    const isLimitReached = totalEarned >= annualRewardLimit || redemptionCount >= redemptionLimit;
    const nextResetDate = account?.redemptionLimitResetsAt
        ? formatDate(account.redemptionLimitResetsAt, { dateStyle: 'long', timeZone: 'UTC' })
        : // TODO: The backend may not reset the limit, the copy needs a variant without the date.
          '-';

    return (
        <>
            <ReferralLinkCard
                referralLink={shareUrl}
                rewardAmount={formatAmount(program.rewardAmount)}
                minimumOrderAmount={formatAmount(program.minimumOrderAmount)}
                friendDiscountPercentage={program.friendDiscountPercentage}
                annualReferralLimit={redemptionLimit}
                annualRewardLimit={formatAmount(annualRewardLimit)}
                nextResetDate={nextResetDate}
                isLimitReached={accountState.status === 'loaded' && isLimitReached}
            />
            {accountState.status === 'loaded' && vouchers !== null && (
                <ReferralRewards
                    vouchers={vouchers}
                    redemptionCount={redemptionCount}
                    fiatCurrency={program.fiatCurrency}
                    annualRewardLimit={annualRewardLimit}
                    annualReferralLimit={redemptionLimit}
                />
            )}
            {(accountState.status === 'idle' || accountState.status === 'loading') && (
                <ReferralLoading />
            )}
            {accountState.status === 'keyMissing' && (
                <ReferralRewardsKeyMissing
                    isDerivingKey={accountState.pendingAction === 'deriveKey'}
                    onDeriveKey={deriveKey}
                />
            )}
            {accountState.status === 'error' && (
                <ReferralError
                    title="TR_REFERRAL_ERROR_REWARDS"
                    onRetry={() => dispatch(fetchReferralAccountThunk({ deviceId }))}
                />
            )}
        </>
    );
};
