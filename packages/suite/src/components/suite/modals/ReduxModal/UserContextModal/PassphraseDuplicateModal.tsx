import { authorizeDevice, switchDuplicatedDevice } from '@suite-common/wallet-core';
import { Button, Column, H3, Text } from '@trezor/components';

import { Translation } from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { TrezorDevice } from 'src/types/suite';
import { SwitchDeviceRenderer } from 'src/views/suite/SwitchDevice/SwitchDeviceRenderer';
import { CardWithDevice } from 'src/views/suite/SwitchDevice/CardWithDevice';
type PassphraseDuplicateModalProps = {
    device: TrezorDevice;
    duplicate: TrezorDevice;
};

export const PassphraseDuplicateModal = ({ device, duplicate }: PassphraseDuplicateModalProps) => {
    const dispatch = useDispatch();
    const { isLocked } = useDevice();

    const isDeviceLocked = isLocked();

    const handleSwitchDevice = () => dispatch(switchDuplicatedDevice({ device, duplicate }));
    const handleAuthorizeDevice = () => dispatch(authorizeDevice());

    return (
        <SwitchDeviceRenderer isCancelable={false} data-test="@passphrase-duplicate">
            <CardWithDevice device={device}>
                <H3 margin={{ top: 12 }}>
                    <Translation id="TR_WALLET_DUPLICATE_TITLE" />
                </H3>
                <Text color="textSubdued">
                    <Translation id="TR_WALLET_DUPLICATE_DESC" />
                </Text>

                <Column gap={8} margin={{ top: 20 }}>
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
            </CardWithDevice>
        </SwitchDeviceRenderer>
    );
};
