import styled from 'styled-components';

import { selectDeviceLabelOrNameById, selectSelectedDevice } from '@suite-common/wallet-core';
import { Image, Row } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/device-utils';
import { spacings } from '@trezor/theme';

import { DeviceConnectionText } from './DeviceConnectionText';
import { DeviceDetail } from './DeviceDetail';
import { Translation } from '../../../../components/suite';
import { useSelector } from '../../../../hooks/suite';

// eslint-disable-next-line local-rules/no-override-ds-component
const DeviceImage = styled(Image)`
    object-fit: contain;
`;

const SmallDeviceImage = styled(DeviceImage)`
    width: 18px;
`;

type SmallDeviceItemProps = {
    forceAlternativeDeviceLabel?: string;
};

export const SmallDeviceItem = ({ forceAlternativeDeviceLabel }: SmallDeviceItemProps) => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const deviceLabel = useSelector(state =>
        selectDeviceLabelOrNameById(state, selectedDevice?.id),
    );

    const isConnected = selectedDevice !== undefined;

    const selectedDeviceModelInternal =
        selectedDevice?.features?.internal_model || DeviceModelInternal.UNKNOWN;

    return (
        <Row
            gap={spacings.xs}
            padding={{ vertical: spacings.xs, horizontal: spacings.xs }}
            alignItems="center"
        >
            <SmallDeviceImage alt="Trezor" image={`TREZOR_${selectedDeviceModelInternal}`} />

            <DeviceDetail label={forceAlternativeDeviceLabel || deviceLabel || 'Trezor'}>
                <DeviceConnectionText
                    icon={isConnected ? 'link' : 'linkBreak'}
                    variant={isConnected ? 'primary' : 'destructive'}
                >
                    <Translation id={isConnected ? 'TR_CONNECTED' : 'TR_DISCONNECTED'} />
                </DeviceConnectionText>
            </DeviceDetail>
        </Row>
    );
};
