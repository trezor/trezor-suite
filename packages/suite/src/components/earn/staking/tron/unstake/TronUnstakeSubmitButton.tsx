import { useFormState } from 'react-hook-form';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import {
    selectStakeableStakingProductDescriptorBySymbol,
    useStakingAccess,
} from '@suite-common/earn-staking';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Button, Tooltip } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';

import { useEarnDeviceStatus } from '#src/hooks/earn/useEarnDeviceStatus';
import { useTronFirmwareUpgradeModal } from '#src/hooks/earn/useTronFirmwareUpgradeModal';
import { useMessageSystemStaking } from '#src/hooks/suite/useMessageSystemStaking';
import { useSelector } from '#src/hooks/suite/useSelector';

import { useTronStakeContext } from '../TronStakeContext';

export const TronUnstakeSubmitButton = () => {
    const deviceStatus = useEarnDeviceStatus();
    const { device, isLocked } = useDevice();
    const { analytics } = useServices(injectDesktopAnalytics);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const { account, form, actions, amountInput } = useTronStakeContext();
    const { isSubmitting, pendingTxid, submitAction } = actions;
    const { isValid } = useFormState({ control: form.methods.control });

    const { openFirmwareModal, firmwareModal } = useTronFirmwareUpgradeModal();

    const { isUnstakingDisabled, unstakingMessageContent } = useMessageSystemStaking(
        account.symbol,
    );

    const productId = useSelector(
        state => selectStakeableStakingProductDescriptorBySymbol(state, account.symbol)?.id ?? null,
    );
    const access = useStakingAccess(productId);
    const isUnstakeFirmwareOutdated = access.disabled.unstake?.kind === 'firmware';

    const isDeviceLocked = !!device?.connected && !!device?.available && isLocked();

    const handleClick = () => {
        if (isUnstakingDisabled) {
            return;
        }

        if (isUnstakeFirmwareOutdated) {
            openFirmwareModal('TR_EARN_TRON_UNSTAKE_TITLE');

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
        <>
            {firmwareModal}

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
        </>
    );
};
