import { events, injectDesktopAnalytics } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import {
    selectStakingAccountPositionDetails,
    useStakingAccountPosition,
} from '@suite-common/earn-staking';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { Button, Tooltip } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';

import { CountdownTimer } from '#src/components/suite/CountdownTimer';
import { useEarnDeviceStatus } from '#src/hooks/earn/useEarnDeviceStatus';
import { useTronFirmwareUpgradeModal } from '#src/hooks/earn/useTronFirmwareUpgradeModal';
import { useTronRewardsClaimCoolDown } from '#src/hooks/earn/useTronRewardsClaimCoolDown';
import { useMessageSystemStaking } from '#src/hooks/suite/useMessageSystemStaking';
import { useSelector } from '#src/hooks/suite/useSelector';

import { useTronStakeContext } from '../TronStakeContext';

export const TronClaimSubmitButton = () => {
    const deviceStatus = useEarnDeviceStatus();
    const { device, isLocked } = useDevice();
    const { analytics } = useServices(injectDesktopAnalytics);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const { account, actions } = useTronStakeContext();
    const { isSubmitting, pendingTxid, submitAction } = actions;
    const { openFirmwareModal, firmwareModal } = useTronFirmwareUpgradeModal();

    const { isClaimingDisabled, claimingMessageContent } = useMessageSystemStaking(account.symbol);

    const { totals, access } = useStakingAccountPosition(account.key);

    const rewardClaimAvailableAt = useSelector(
        state =>
            selectStakingAccountPositionDetails(state, account.key, 'tron-staking')
                ?.rewardClaimAvailableAt ?? null,
    );

    const { isClaimOnCooldown, claimCooldownEndsAt } =
        useTronRewardsClaimCoolDown(rewardClaimAvailableAt);

    const hasReward = isPositiveBalance(totals.rewards);
    const isDeviceLocked = !!device?.connected && !!device?.available && isLocked();
    const isClaimFirmwareOutdated = access.disabled.claim?.kind === 'firmware';

    const isDisabled =
        isClaimingDisabled ||
        !hasReward ||
        isClaimOnCooldown ||
        isSubmitting ||
        isDeviceLocked ||
        !!pendingTxid;
    const isLoading = isSubmitting || isDiscoveryRunning;

    const tooltipContent =
        claimingMessageContent ??
        (isClaimOnCooldown && claimCooldownEndsAt !== null ? (
            <CountdownTimer
                deadline={claimCooldownEndsAt}
                message="TR_EARN_TRON_CLAIM_COOLDOWN"
                minUnit="minute"
                unitDisplay="narrow"
            />
        ) : undefined);

    const handleClick = () => {
        if (isClaimingDisabled) return;

        if (isClaimFirmwareOutdated) {
            openFirmwareModal('TR_EARN_TRON_CLAIM_TITLE');

            return;
        }

        analytics.report({
            type: events.stakingClaimEvent.name,
            payload: {
                action: 'continue',
                deviceStatus,
                step: 'claim-form-modal',
                networkSymbol: account.symbol,
            },
        });

        void submitAction(() => openFirmwareModal('TR_EARN_TRON_CLAIM_TITLE'));
    };

    return (
        <>
            {firmwareModal}

            <Tooltip content={tooltipContent}>
                <Button
                    size="large"
                    width="100%"
                    onClick={handleClick}
                    data-testid="@staking/tron-claim/continue-button"
                    isDisabled={isDisabled}
                    isLoading={isLoading}
                >
                    <Translation id="TR_CONTINUE" />
                </Button>
            </Tooltip>
        </>
    );
};
