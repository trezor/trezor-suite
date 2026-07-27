import { Translation } from '@suite/intl';
import { selectDeviceLabelOrNameById, selectSelectedDevice } from '@suite-common/device';
import { getDeviceInternalModel } from '@suite-common/suite-utils';
import { Image, Row } from '@trezor/components';
import { LinkBreakIcon, LinkIcon } from '@trezor/icons';

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
        <Row gap={8} padding={{ vertical: 8, horizontal: 8 }} alignItems="center">
            <Image
                width={18}
                objectFit="contain"
                alt="Trezor"
                image={`TREZOR_${selectedDeviceModelInternal}`}
            />

            <DeviceDetail label={forceAlternativeDeviceLabel || deviceLabel || 'Trezor'}>
                <DeviceConnectionText
                    icon={isConnected ? LinkIcon : LinkBreakIcon}
                    intent={isConnected ? 'brand' : 'critical'}
                >
                    <Translation id={isConnected ? 'TR_CONNECTED' : 'TR_DISCONNECTED'} />
                </DeviceConnectionText>
            </DeviceDetail>
        </Row>
    );
};
