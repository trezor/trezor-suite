import {
    cancelDiscoveryThunk,
    runDiscoveryThunk,
    selectDeviceThunk,
    selectDevices,
    selectDiscovery,
    startDiscoveryThunk,
} from '@suite-common/wallet-core';
import { DiscoveryStatus } from '@suite-common/wallet-types';
import { Button, Column, H3, Text, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { TrezorDevice } from 'src/types/suite';
import { CardWithDevice } from 'src/views/suite/SwitchDevice/CardWithDevice';
import { SwitchDeviceModal } from 'src/views/suite/SwitchDevice/SwitchDeviceModal';

type PassphraseDuplicateModalProps = {
    device: TrezorDevice;
    isExistingWallet: boolean;
    discovery: Extract<DiscoveryStatus, { status: 'passphrase-duplicate' }>;
};

export const PassphraseDuplicateModal = ({
    discovery,
    device,
    isExistingWallet,
}: PassphraseDuplicateModalProps) => {
    const { isLocked } = useDevice();
    const dispatch = useDispatch();
    const devices = useSelector(selectDevices);
    const discoveries = useSelector(selectDiscovery);

    const isDeviceLocked = isLocked();

    const switchToDuplicateWallet = () => {
        dispatch(cancelDiscoveryThunk(device));

        devices
            .filter(
                candidate =>
                    candidate.state?.staticSessionId === discovery.duplicateDeviceStaticSessionId,
            )
            .forEach(device => {
                dispatch(selectDeviceThunk({ device }));
            });
    };

    const onTryDifferentPassphrase = () => {
        dispatch(cancelDiscoveryThunk(device));
        dispatch(
            startDiscoveryThunk({
                device,
                isAddingHiddenWallet: true,
                isAddingExistingWallet: isExistingWallet,
            }),
        );
    };

    const onBack = () => {
        dispatch(cancelDiscoveryThunk(device));
        dispatch(
            startDiscoveryThunk({
                device,
                ...discovery,
            }),
        );

        const nextDiscovery = discoveries?.[device.path];
        if (!nextDiscovery) return;

        dispatch(runDiscoveryThunk(device));
    };

    return (
        <SwitchDeviceModal>
            <CardWithDevice device={device} isFullHeaderVisible={false} onBackButtonClick={onBack}>
                <Column gap={spacings.xs} margin={{ top: spacings.xxs }}>
                    <H3 data-testid="@passphrase-duplicate-header">
                        <Translation id="TR_WALLET_DUPLICATE_TITLE" />
                    </H3>
                    <Text variant="tertiary">
                        <Translation id="TR_WALLET_DUPLICATE_DESC" />
                    </Text>
                    <Column gap={spacings.xs} margin={{ top: spacings.lg }} alignItems="stretch">
                        <Tooltip
                            isActive={isDeviceLocked}
                            content={
                                <Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />
                            }
                        >
                            <Button
                                variant="primary"
                                onClick={switchToDuplicateWallet}
                                isDisabled={isDeviceLocked}
                                isFullWidth
                            >
                                <Translation id="TR_WALLET_DUPLICATE_SWITCH" />
                            </Button>
                        </Tooltip>
                        <Tooltip
                            isActive={isDeviceLocked}
                            content={
                                <Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />
                            }
                        >
                            <Button
                                variant="tertiary"
                                onClick={onTryDifferentPassphrase}
                                isDisabled={isDeviceLocked}
                                isFullWidth
                            >
                                <Translation id="TR_WALLET_DUPLICATE_RETRY" />
                            </Button>
                        </Tooltip>
                    </Column>
                </Column>
            </CardWithDevice>
        </SwitchDeviceModal>
    );
};
