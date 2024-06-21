import { Button, H3, Column, Text } from '@trezor/components';

import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { SwitchDeviceRenderer } from 'src/views/suite/SwitchDevice/SwitchDeviceRenderer';
import { CardWithDevice } from 'src/views/suite/SwitchDevice/CardWithDevice';
import { Translation } from '../../../Translation';
import { selectSuiteSettings } from '../../../../../reducers/suite/suiteReducer';
import { deviceActions } from '@suite-common/wallet-core';

export const PassphraseMismatchModal = ({ onCancel }: { onCancel: () => void }) => {
    const { isLocked, device } = useDevice();
    const dispatch = useDispatch();
    const settings = useSelector(selectSuiteSettings);

    const isDeviceLocked = isLocked();

    if (device === undefined) {
        return null;
    }

    const onStartOver = () => {
        dispatch(deviceActions.forgetDevice({ device, settings }));
        dispatch(deviceActions.selectDevice(device));
        onCancel();
    };

    return (
        <SwitchDeviceRenderer isCancelable={false} data-test="@passphrase-mismatch">
            <CardWithDevice device={device} isCloseButtonVisible={false}>
                <Column gap={8} margin={{ bottom: 32 }} alignItems="center">
                    <H3 margin={{ top: 12 }}>
                        <Translation id="TR_PASSPHRASE_MISMATCH" />
                    </H3>
                    <Text variant="tertiary">
                        <Translation id="TR_PASSPHRASE_MISMATCH_DESCRIPTION" />
                    </Text>
                </Column>

                <Button
                    variant="primary"
                    onClick={onStartOver}
                    isDisabled={isDeviceLocked}
                    isFullWidth
                >
                    <Translation id="TR_PASSPHRASE_MISMATCH_START_OVER" />
                </Button>
            </CardWithDevice>
        </SwitchDeviceRenderer>
    );
};
