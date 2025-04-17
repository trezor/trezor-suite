import styled from 'styled-components';

import { DEFAULT_FLAGSHIP_MODEL } from '@suite-common/suite-constants';
import { selectDeviceLabelOrNameById, selectSelectedDevice } from '@suite-common/wallet-core';
import { Image, Row } from '@trezor/components';
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
    const selectedDeviceModelInternal =
        selectedDevice?.features?.internal_model || DEFAULT_FLAGSHIP_MODEL;
    const deviceLabel = useSelector(state =>
        selectDeviceLabelOrNameById(state, selectedDevice?.id),
    );

    return (
        <Row
            gap={spacings.xs}
            padding={{ vertical: spacings.xs, horizontal: spacings.xs }}
            alignItems="center"
        >
            <SmallDeviceImage alt="Trezor" image={`TREZOR_${selectedDeviceModelInternal}`} />

            <DeviceDetail label={forceAlternativeDeviceLabel ?? deviceLabel}>
                <DeviceConnectionText icon="link" variant="primary">
                    <Translation id="TR_CONNECTED" />
                </DeviceConnectionText>
            </DeviceDetail>
        </Row>
    );
};
