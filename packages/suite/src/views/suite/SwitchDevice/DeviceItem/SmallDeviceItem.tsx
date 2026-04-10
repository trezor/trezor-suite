import { Translation } from '@suite/intl';
import { selectDeviceLabelOrNameById, selectSelectedDevice } from '@suite-common/device';
import { getDeviceInternalModel } from '@suite-common/suite-utils';
import { Image, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';

import { DeviceConnectionText } from './DeviceConnectionText';
import { DeviceDetail } from './DeviceDetail';

type SmallDeviceItemProps = {
    forceAlternativeDeviceLabel?: string;
};

export const SmallDeviceItem = ({ forceAlternativeDeviceLabel }: SmallDeviceItemProps) => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const deviceLabel = useSelector(state =>
        selectDeviceLabelOrNameById(state, selectedDevice?.id),
    );

    const isConnected = selectedDevice !== undefined;

    const selectedDeviceModelInternal = getDeviceInternalModel(selectedDevice);

    return (
        <Row
            gap={spacings.xs}
            padding={{ vertical: spacings.xs, horizontal: spacings.xs }}
            alignItems="center"
        >
            <Image
                width={18}
                objectFit="contain"
                alt="Trezor"
                image={`TREZOR_${selectedDeviceModelInternal}`}
            />

            <DeviceDetail label={forceAlternativeDeviceLabel || deviceLabel || 'Trezor'}>
                <DeviceConnectionText
                    icon={isConnected ? 'link' : 'linkBreak'}
                    intent={isConnected ? 'brand' : 'critical'}
                >
                    <Translation id={isConnected ? 'TR_CONNECTED' : 'TR_DISCONNECTED'} />
                </DeviceConnectionText>
            </DeviceDetail>
        </Row>
    );
};
