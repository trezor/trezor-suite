import { Button, Column, H3, Text } from '@trezor/components';

import { authorizeDeviceThunk, switchDuplicatedDevice } from '@suite-common/wallet-core';

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
    const handleAuthorizeDevice = () => dispatch(authorizeDeviceThunk());

    return (
        <SwitchDeviceRenderer isCancelable={false}>
            <CardWithDevice device={device} isFullHeaderVisible={false}>
                <H3 margin={{ top: 12 }} data-testid="@passphrase-duplicate-header">
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
