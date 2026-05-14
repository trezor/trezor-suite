import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { type TrezorDevice } from '@suite-common/suite-types';
import { cancelDiscoveryThunk, startDiscoveryThunk } from '@suite-common/wallet-core';
import { type DiscoveryStatus } from '@suite-common/wallet-types';
import { Button, Column, H3, Text, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useDispatch } from 'src/hooks/suite';
import { CardWithDevice } from 'src/views/suite/SwitchDevice/CardWithDevice';
import { SwitchDeviceModal } from 'src/views/suite/SwitchDevice/SwitchDeviceModal';

export const PassphraseMismatchModal = ({
    device,
    discovery,
}: {
    device: TrezorDevice;
    discovery: DiscoveryStatus;
}) => {
    const { isLocked } = useDevice();

    const isDeviceLocked = isLocked();

    const dispatch = useDispatch();

    const onStartOver = () => {
        dispatch(cancelDiscoveryThunk(device));

        dispatch(
            startDiscoveryThunk({
                device,
                isAddingHiddenWallet: discovery.isAddingHiddenWallet,
                isAddingExistingWallet: discovery.isAddingExistingWallet,
            }),
        );
    };

    return (
        <SwitchDeviceModal data-testid="@passphrase-mismatch">
            <CardWithDevice device={device}>
                <Column gap={spacings.xs} margin={{ bottom: spacings.lg }}>
                    <H3 data-testid="@passphrase-mismatch-header">
                        <Translation id="TR_PASSPHRASE_MISMATCH" />
                    </H3>
                    <Text
                        data-testid="@passphrase-mismatch-description"
                        intent="neutral"
                        priority="secondary"
                    >
                        <Translation id="TR_PASSPHRASE_MISMATCH_DESCRIPTION" />
                    </Text>
                </Column>
                <Tooltip
                    isActive={isDeviceLocked}
                    content={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />}
                >
                    <Button
                        intent="brand"
                        onClick={onStartOver}
                        isDisabled={isDeviceLocked}
                        width="100%"
                        data-testid="@passphrase-mismatch/start-over"
                    >
                        <Translation id="TR_PASSPHRASE_MISMATCH_START_OVER" />
                    </Button>
                </Tooltip>
            </CardWithDevice>
        </SwitchDeviceModal>
    );
};
