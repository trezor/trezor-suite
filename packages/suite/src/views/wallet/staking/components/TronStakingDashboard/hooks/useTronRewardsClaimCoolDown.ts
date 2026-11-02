import { getTronRewardClaimCooldownEndsAt } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { useCountdownTimer } from '@trezor/react-utils';

export function useTronRewardsClaimCoolDown(account: Account) {
    const claimCooldownEndsAt = getTronRewardClaimCooldownEndsAt(account);
    const cooldownEndsAtMs = claimCooldownEndsAt === null ? null : claimCooldownEndsAt * 1000;
    const { isPastDeadline } = useCountdownTimer(cooldownEndsAtMs ?? 0, {
        isEnabled: cooldownEndsAtMs !== null,
        // `pastDeadlineLeadMs: 0` because the default of 1s would enable Claim before the cooldown is actually over.
        pastDeadlineLeadMs: 0,
    });

    const isClaimOnCooldown = cooldownEndsAtMs !== null && !isPastDeadline;

    return { isClaimOnCooldown, claimCooldownEndsAt };
}
