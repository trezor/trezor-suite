import { Button, Column, H3, Text, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useDevice } from 'src/hooks/suite';
import { useServices } from 'src/reducers/services';
import { TrezorDevice } from 'src/types/suite';
import { CardWithDevice } from 'src/views/suite/SwitchDevice/CardWithDevice';
import { SwitchDeviceModal } from 'src/views/suite/SwitchDevice/SwitchDeviceModal';

type PassphraseDuplicateModalProps = {
    device: TrezorDevice;
};

export const PassphraseDuplicateModal = ({ device }: PassphraseDuplicateModalProps) => {
    const { isLocked } = useDevice();
    const { passphraseFlowManager } = useServices();

    const isDeviceLocked = isLocked();

    const handleSwitchDevice = () => {
        passphraseFlowManager.finishFlow();
    };

    const onCancel = () => {
        passphraseFlowManager.startOver(device);
    };

    return (
        <SwitchDeviceModal>
            <CardWithDevice device={device} isFullHeaderVisible={false}>
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
                                onClick={handleSwitchDevice}
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
                                onClick={onCancel}
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
