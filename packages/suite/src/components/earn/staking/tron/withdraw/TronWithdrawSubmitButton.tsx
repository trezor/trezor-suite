import { events, injectDesktopAnalytics } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { getTronWithdrawableBalance, selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Button, Tooltip } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { BigNumber } from '@trezor/utils';

import { useEarnDeviceStatus } from '../../../../../hooks/earn/useEarnDeviceStatus';
import { useSelector } from '../../../../../hooks/suite';
import { useMessageSystemStaking } from '../../../../../hooks/suite/useMessageSystemStaking';
import { useTronStakeContext } from '../TronStakeContext';

export const TronWithdrawSubmitButton = () => {
    const deviceStatus = useEarnDeviceStatus();
    const { device, isLocked } = useDevice();
    const { analytics } = useServices(injectDesktopAnalytics);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const { account, actions } = useTronStakeContext();
    const { isSubmitting, pendingTxid, submitAction } = actions;

    const { isWithdrawingDisabled, withdrawingMessageContent } = useMessageSystemStaking(
        account.symbol,
    );

    const hasWithdrawableAmount = new BigNumber(getTronWithdrawableBalance(account)).gt(0);
    const isDeviceUnavailable = !!device?.connected && !!device?.available && isLocked();

    const handleClick = () => {
        if (isWithdrawingDisabled) {
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
        <Tooltip content={withdrawingMessageContent}>
            <Button
                size="large"
                width="100%"
                onClick={handleClick}
                data-testid="@staking/tron-withdraw/continue-button"
                isDisabled={
                    isWithdrawingDisabled ||
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
    );
};
