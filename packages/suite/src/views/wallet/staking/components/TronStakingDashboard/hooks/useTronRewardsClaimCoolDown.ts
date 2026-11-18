import { useCountdownTimer } from '@trezor/react-utils';

// `availableAt` is the end of the claim cooldown in milliseconds, as the position reports it.
export function useTronRewardsClaimCoolDown(availableAt: number | null) {
    const { isPastDeadline } = useCountdownTimer(availableAt ?? 0, {
        isEnabled: availableAt !== null,
        // `pastDeadlineLeadMs: 0` because the default of 1s would enable Claim before the cooldown is actually over.
        pastDeadlineLeadMs: 0,
    });

    const isClaimOnCooldown = availableAt !== null && !isPastDeadline;

    return { isClaimOnCooldown, claimCooldownEndsAt: availableAt };
}
