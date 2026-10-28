import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';

import { type DeviceRootState } from '@suite-common/device';
import {
    type ReferAFriendRootState,
    type ReferralProgram,
    fetchReferralAccountThunk,
    getReferralRewardsSummary,
    selectReferralAccountState,
    selectReferralKeyDerivationDevice,
} from '@suite-common/refer-a-friend';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { ReferralError } from './ReferralError';
import { ReferralLinkCard } from './ReferralLinkCard';
import { ReferralLoading } from './ReferralLoading';
import { ReferralRewards } from './ReferralRewards';
import { ReferralRewardsKeyMissing } from './ReferralRewardsKeyMissing';
import { ANNUAL_REWARD_LIMIT, REWARD_WAITING_PERIOD_DAYS } from './referralConstants';
import { useReferralActions } from './useReferralActions';

type ReferralJoinedContentProps = {
    deviceId: string;
    shareUrl: string;
    isDeviceConnected: boolean;
    program: ReferralProgram;
};

export const ReferralJoinedContent = ({
    deviceId,
    shareUrl,
    isDeviceConnected,
    program,
}: ReferralJoinedContentProps) => {
    const accountState = useSelector((state: ReferAFriendRootState) =>
        selectReferralAccountState(state, deviceId),
    );
    const canDeriveKey = useSelector(
        (state: DeviceRootState) => selectReferralKeyDerivationDevice(state, deviceId) !== null,
    );

    const { dispatch } = useServices(injectDispatch);
    const { formatNumber, formatDate } = useIntl();
    const { deriveKey } = useReferralActions(deviceId);

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
    const isLimitReached = totalEarned >= ANNUAL_REWARD_LIMIT || redemptionCount >= redemptionLimit;
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
                annualRewardLimit={formatAmount(ANNUAL_REWARD_LIMIT)}
                nextResetDate={nextResetDate}
                isLimitReached={accountState.status === 'loaded' && isLimitReached}
            />
            {accountState.status === 'loaded' && vouchers !== null && (
                <ReferralRewards
                    vouchers={vouchers}
                    redemptionCount={redemptionCount}
                    fiatCurrency={program.fiatCurrency}
                    annualRewardLimit={ANNUAL_REWARD_LIMIT}
                    annualReferralLimit={redemptionLimit}
                    rewardWaitingPeriodDays={REWARD_WAITING_PERIOD_DAYS}
                />
            )}
            {(accountState.status === 'idle' || accountState.status === 'loading') && (
                <ReferralLoading />
            )}
            {accountState.status === 'keyMissing' && (
                <ReferralRewardsKeyMissing
                    isDeviceConnected={isDeviceConnected}
                    canDeriveKey={canDeriveKey}
                    isDerivingKey={accountState.pendingAction === 'deriveKey'}
                    onDeriveKey={deriveKey}
                />
            )}
            {accountState.status === 'error' && (
                <ReferralError
                    title="TR_REFERRAL_ERROR_REWARDS"
                    error={accountState.error}
                    onRetry={() => dispatch(fetchReferralAccountThunk({ deviceId }))}
                />
            )}
        </>
    );
};
