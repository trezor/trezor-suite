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

export const TronFreezeSubmitButton = () => {
    const deviceStatus = useEarnDeviceStatus();
    const { device, isLocked } = useDevice();
    const { analytics } = useServices(injectDesktopAnalytics);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const { account, form, actions, amountInput } = useTronStakeContext();
    const { isSubmitting, pendingTxid, submitAction } = actions;
    const { isValid } = useFormState({ control: form.methods.control });

    const { openFirmwareModal, firmwareModal } = useTronFirmwareUpgradeModal();

    const { isStakingDisabled, stakingMessageContent } = useMessageSystemStaking(account.symbol);

    // A first stake has no position yet, so the gate reads the product the network stakes on.
    const productId = useSelector(
        state => selectStakeableStakingProductDescriptorBySymbol(state, account.symbol)?.id ?? null,
    );
    const access = useStakingAccess(productId);

    const isDeviceLocked = !!device?.connected && !!device?.available && isLocked();
    const isStakeFirmwareOutdated = access.disabled.stake?.kind === 'firmware';

    const handleClick = () => {
        if (isStakingDisabled) {
            return;
        }

        if (isStakeFirmwareOutdated) {
            openFirmwareModal('TR_EARN_TRON_STAKE_TITLE');

            return;
        }

        analytics.report({
            type: events.stakingStakeEvent.name,
            payload: {
                action: 'continue',
                deviceStatus,
                step: 'stake-form-modal',
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

            <Tooltip content={stakingMessageContent}>
                <Button
                    size="large"
                    width="100%"
                    onClick={handleClick}
                    data-testid="@staking/tron-freeze/continue-button"
                    isDisabled={
                        isStakingDisabled ||
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
