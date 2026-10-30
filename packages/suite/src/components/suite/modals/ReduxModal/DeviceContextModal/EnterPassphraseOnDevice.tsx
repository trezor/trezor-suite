import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';

import { Translation, messages } from '@suite/intl';
import { selectModalDevice } from '@suite/modal';
import { selectSelectedDevice, selectSelectedDeviceLabelOrName } from '@suite-common/device';
import { Column, H3, Paragraph, Row } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { DeviceWithScene } from '@trezor/product-components';

import { CardWithDevice } from 'src/views/suite/SwitchDevice/CardWithDevice';
import { SwitchDeviceModal } from 'src/views/suite/SwitchDevice/SwitchDeviceModal';

export const EnterPassphraseOnDevice = () => {
    // NOTE: selected device may not be the one which is currently requesting for the passphrase.
    // When creating a wallet the one which is being created does not exists in the reducer yet.
    // see modalReducer.device to access the device (the trezor/connect type of device) which is currently requesting the passphrase.
    const device = useSelector(selectSelectedDevice);
    const requestingDevice = useSelector(selectModalDevice);

    const intl = useIntl();
    const deviceLabel = useSelector(selectSelectedDeviceLabelOrName);

    const onCancel = () =>
        TrezorConnect.cancel({ reason: intl.formatMessage(messages.TR_CANCELLED) });

    if (!device?.features) {
        return null;
    }

    return (
        <SwitchDeviceModal onCancel={onCancel}>
            <CardWithDevice
                onCancel={onCancel}
                device={device}
                forceConnectionInfo={!requestingDevice?.state?.staticSessionId}
            >
                <Column gap={8} padding={{ horizontal: 8 }} margin={{ bottom: 16 }}>
                    <H3>
                        <Translation
                            id="TR_ENTER_PASSPHRASE_ON_DEVICE_LABEL"
                            values={{ deviceLabel }}
                        />
                    </H3>

                    <Paragraph>
                        <Translation id="TR_PASSPHRASE_CASE_SENSITIVE" />
                    </Paragraph>

                    <Row alignSelf="center" data-testid="@modal/enter-passphrase-on-device">
                        <DeviceWithScene
                            deviceModel={device.features.internal_model}
                            unitColor={device.features.unit_color}
                            scene="confirm"
                            width={100}
                            margin={24}
                        />
                    </Row>
                </Column>
            </CardWithDevice>
        </SwitchDeviceModal>
    );
};
