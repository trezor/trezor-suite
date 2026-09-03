import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { FirmwareUpgradeNeededModal } from '@suite/firmware-upgrade';
import { Translation, useTranslation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import {
    getTronStakingRewards,
    isTronClaimSupported,
    selectHasRunningDiscovery,
} from '@suite-common/wallet-core';
import { Button, Tooltip } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';
import { useFirmwareUpgradeModal } from 'src/hooks/suite/useFirmwareUpgradeModal';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

import { useTronStakeContext } from '../TronStakeContext';

export const TronClaimSubmitButton = () => {
    const { device, isLocked } = useDevice();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const { translationString } = useTranslation();
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const { account, actions } = useTronStakeContext();
    const { isSubmitting, pendingTxid, submitAction } = actions;
    const { isFirmwareModalOpen, openFirmwareModal, closeFirmwareModal, updateFirmware } =
        useFirmwareUpgradeModal();

    const { isClaimingDisabled, claimingMessageContent } = useMessageSystemStaking(account.symbol);

    const hasReward = new BigNumber(getTronStakingRewards(account)).gt(0);
    const isDeviceLocked = !!device?.connected && !!device?.available && isLocked();
    const isClaimFirmwareOutdated = !isTronClaimSupported(device);

    const isDisabled =
        isClaimingDisabled || !hasReward || isSubmitting || isDeviceLocked || !!pendingTxid;
    const isLoading = isSubmitting || isDiscoveryRunning;

    const handleClick = () => {
        if (isClaimingDisabled) {
            return;
        }

        if (isClaimFirmwareOutdated) {
            openFirmwareModal();

            return;
        }

        submitAction();

        if (!device?.connected || !device?.available) {
            return;
        }

        analytics.report({
            type: events.stakingClaimEvent.name,
            payload: {
                action: 'continue',
                step: 'claim-form-modal',
                networkSymbol: account.symbol,
            },
        });
    };

    return (
        <>
            {isFirmwareModalOpen && (
                <FirmwareUpgradeNeededModal
                    onClose={closeFirmwareModal}
                    onUpdate={updateFirmware}
                    featureName={translationString('TR_EARN_TRON_CLAIM_TITLE')}
                />
            )}

            <Tooltip content={claimingMessageContent}>
                <Button
                    size="large"
                    width="100%"
                    onClick={handleClick}
                    isDisabled={isDisabled}
                    isLoading={isLoading}
                >
                    <Translation id="TR_CONTINUE" />
                </Button>
            </Tooltip>
        </>
    );
};
