import { useFormState } from 'react-hook-form';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Button, Tooltip } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';

import { useEarnDeviceStatus } from 'src/hooks/earn/useEarnDeviceStatus';
import { useSelector } from 'src/hooks/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

import { useTronStakeContext } from '../TronStakeContext';

export const TronUnstakeSubmitButton = () => {
    const deviceStatus = useEarnDeviceStatus();
    const { device, isLocked } = useDevice();
    const { analytics } = useServices(injectDesktopAnalytics);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const { account, form, actions, amountInput } = useTronStakeContext();
    const { isSubmitting, pendingTxid, submitAction } = actions;
    const { isValid } = useFormState({ control: form.methods.control });

    const { isUnstakingDisabled, unstakingMessageContent } = useMessageSystemStaking(
        account.symbol,
    );

    const isDeviceLocked = !!device?.connected && !!device?.available && isLocked();

    const handleClick = () => {
        if (isUnstakingDisabled) {
            return;
        }

        analytics.report({
            type: events.stakingUnstakeEvent.name,
            payload: {
                action: 'continue',
                deviceStatus,
                step: 'unstake-form-modal',
                networkSymbol: account.symbol,
                currency: amountInput.currency,
                resource: form.methods.getValues().resourceType,
            },
        });

        submitAction();
    };

    return (
        <Tooltip content={unstakingMessageContent}>
            <Button
                size="large"
                width="100%"
                onClick={handleClick}
                data-testid="@staking/tron-unstake/continue-button"
                isDisabled={
                    isUnstakingDisabled ||
                    !isValid ||
                    isSubmitting ||
                    isDeviceLocked ||
                    !!pendingTxid
                }
                isLoading={isSubmitting || isDiscoveryRunning}
            >
                <Translation id="TR_CONTINUE" />
            </Button>
        </Tooltip>
    );
};
