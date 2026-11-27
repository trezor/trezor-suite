import { events, injectDesktopAnalytics } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { useStakingAccountPosition } from '@suite-common/earn-staking';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { Button, Tooltip } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';

import { useEarnDeviceStatus } from '#src/hooks/earn/useEarnDeviceStatus';
import { useTronFirmwareUpgradeModal } from '#src/hooks/earn/useTronFirmwareUpgradeModal';
import { useTronWithdrawableAmount } from '#src/hooks/earn/useTronWithdrawableAmount';
import { useMessageSystemStaking } from '#src/hooks/suite/useMessageSystemStaking';
import { useSelector } from '#src/hooks/suite/useSelector';

import { useTronStakeContext } from '../TronStakeContext';

export const TronWithdrawSubmitButton = () => {
    const deviceStatus = useEarnDeviceStatus();
    const { device, isLocked } = useDevice();
    const { analytics } = useServices(injectDesktopAnalytics);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const { account, actions, fees } = useTronStakeContext();
    const { isSubmitting, pendingTxid, submitAction } = actions;
    const { openFirmwareModal, firmwareModal } = useTronFirmwareUpgradeModal();

    const { isWithdrawingDisabled, withdrawingMessageContent } = useMessageSystemStaking(
        account.symbol,
    );
    const isFeeReady = fees.composedLevels?.normal?.type === 'final';

    const { access } = useStakingAccountPosition(account.key);
    const withdrawableAmount = useTronWithdrawableAmount(account);

    const hasWithdrawableAmount = isPositiveBalance(withdrawableAmount);
    const isDeviceUnavailable = !!device?.connected && !!device?.available && isLocked();
    const isWithdrawFirmwareOutdated = access.disabled.withdraw?.kind === 'firmware';

    const handleClick = () => {
        if (isWithdrawingDisabled || !isFeeReady) return;

        if (isWithdrawFirmwareOutdated) {
            openFirmwareModal('TR_EARN_TRON_WITHDRAW_TITLE');

            return;
        }

        analytics.report({
            type: events.stakingUnstakeEvent.name,
            payload: {
                action: 'continue',
                deviceStatus,
                step: 'withdraw-form-modal',
                networkSymbol: account.symbol,
            },
        });

        submitAction();
    };

    return (
        <>
            {firmwareModal}

            <Tooltip content={withdrawingMessageContent}>
                <Button
                    size="large"
                    width="100%"
                    onClick={handleClick}
                    data-testid="@staking/tron-withdraw/continue-button"
                    isDisabled={
                        isWithdrawingDisabled ||
                        !isFeeReady ||
                        !hasWithdrawableAmount ||
                        isSubmitting ||
                        isDeviceUnavailable ||
                        !!pendingTxid
                    }
                    isLoading={isSubmitting || isDiscoveryRunning}
                >
                    <Translation id="TR_CONTINUE" />
                </Button>
            </Tooltip>
        </>
    );
};
