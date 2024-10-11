import { Button, Column, H3, Text } from '@trezor/components';

import { authorizeDeviceThunk, switchDuplicatedDevice } from '@suite-common/wallet-core';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { TrezorDevice } from 'src/types/suite';
import { CardWithDevice } from 'src/views/suite/SwitchDevice/CardWithDevice';
import { SwitchDeviceModal } from 'src/views/suite/SwitchDevice/SwitchDeviceModal';

type PassphraseDuplicateModalProps = {
    device: TrezorDevice;
    duplicate: TrezorDevice;
};

export const PassphraseDuplicateModal = ({ device, duplicate }: PassphraseDuplicateModalProps) => {
    const dispatch = useDispatch();
    const { isLocked } = useDevice();

    const isDeviceLocked = isLocked();

    const handleSwitchDevice = () => dispatch(switchDuplicatedDevice({ device, duplicate }));
    const handleAuthorizeDevice = () => dispatch(authorizeDeviceThunk());

    return (
        <SwitchDeviceModal>
            <CardWithDevice device={device} isFullHeaderVisible={false}>
                <Column gap={spacings.xs} margin={{ top: spacings.xxs }} alignItems="stretch">
                    <H3 data-testid="@passphrase-duplicate-header">
                        <Translation id="TR_WALLET_DUPLICATE_TITLE" />
                    </H3>
                    <Text variant="tertiary">
                        <Translation id="TR_WALLET_DUPLICATE_DESC" />
                    </Text>
                    <Column gap={spacings.xs} margin={{ top: spacings.lg }}>
                        <Button
                            variant="primary"
                            onClick={handleSwitchDevice}
                            isDisabled={isDeviceLocked}
                            isFullWidth
                        >
                            <Translation id="TR_WALLET_DUPLICATE_SWITCH" />
                        </Button>
                        <Button
                            variant="tertiary"
                            onClick={handleAuthorizeDevice}
                            isDisabled={isDeviceLocked}
                            isFullWidth
                        >
                            <Translation id="TR_WALLET_DUPLICATE_RETRY" />
                        </Button>
                    </Column>
                </Column>
            </CardWithDevice>
        </SwitchDeviceModal>
    );
};
