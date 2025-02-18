import { switchDuplicatedDevice } from '@suite-common/wallet-core';
import { Button, Column, H3, Text, Tooltip } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { TrezorDevice } from 'src/types/suite';
import { CardWithDevice } from 'src/views/suite/SwitchDevice/CardWithDevice';
import { SwitchDeviceModal } from 'src/views/suite/SwitchDevice/SwitchDeviceModal';

import { usePassphraseModalContext } from '../DeviceContextModal/PassphraseModalContext';

type PassphraseDuplicateModalProps = {
    device: TrezorDevice;
    duplicate: TrezorDevice;
};

export const PassphraseDuplicateModal = ({ device, duplicate }: PassphraseDuplicateModalProps) => {
    const dispatch = useDispatch();
    const { isLocked } = useDevice();

    const isDeviceLocked = isLocked();
    const { setPassphraseState } = usePassphraseModalContext();

    const handleSwitchDevice = () => {
        setPassphraseState('initial');
        dispatch(switchDuplicatedDevice({ device, duplicate }));
    };
    const onCancel = () => {
        TrezorConnect.cancel('auth-confirm-retry');
    };

    return (
        <SwitchDeviceModal onCancel={onCancel}>
            <CardWithDevice device={device} isFullHeaderVisible={false} onCancel={onCancel}>
                <Column gap={spacings.xs} margin={{ top: spacings.xxs }}>
                    <H3 data-testid="@passphrase-duplicate-header">
                        <Translation id="TR_WALLET_DUPLICATE_TITLE" />
                    </H3>
                    <Text variant="tertiary">
                        <Translation id="TR_WALLET_DUPLICATE_DESC" />
                    </Text>
                    <Column gap={spacings.xs} margin={{ top: spacings.lg }} alignItems="normal">
                        <Tooltip
                            isActive={isDeviceLocked}
                            content={
                                <Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />
                            }
                        >
                            <Button
                                variant="primary"
                                onClick={handleSwitchDevice}
                                isDisabled={isDeviceLocked}
                                isFullWidth
                            >
                                <Translation id="TR_WALLET_DUPLICATE_SWITCH" />
                            </Button>
                        </Tooltip>
                    </Column>
                </Column>
            </CardWithDevice>
        </SwitchDeviceModal>
    );
};
