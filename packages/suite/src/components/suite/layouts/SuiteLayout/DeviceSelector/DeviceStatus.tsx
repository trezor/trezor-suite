import { selectDeviceLabelOrNameById } from '@suite-common/device';
import { Row, Tooltip } from '@trezor/components';
import { type DeviceModelInternal, getDeviceColorVariant } from '@trezor/device-utils';
import { RotateDeviceImage } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import { type TrezorDevice } from 'src/types/suite';
import { DeviceDetail } from 'src/views/suite/SwitchDevice/DeviceItem/DeviceDetail';
import { DeviceStatusText } from 'src/views/suite/SwitchDevice/DeviceItem/DeviceStatusText';

type DeviceStatusProps = {
    deviceModel: DeviceModelInternal;
    deviceNeedsRefresh?: boolean;
    device?: TrezorDevice;
    forceConnectionInfo?: boolean;
    isDeviceDetailVisible?: boolean;
};

export const DeviceStatus = ({
    deviceModel,
    deviceNeedsRefresh = false,
    device,
    forceConnectionInfo = false,
    isDeviceDetailVisible = true,
}: DeviceStatusProps) => {
    const deviceLabel = useSelector(state => selectDeviceLabelOrNameById(state, device?.id));

    const image = (
        <Row justifyContent="center" width={24} opacity={deviceNeedsRefresh ? 0.4 : 1}>
            {device && (
                <RotateDeviceImage
                    deviceModel={deviceModel}
                    deviceColor={getDeviceColorVariant(device)}
                    height={34}
                />
            )}
        </Row>
    );

    const content = device && (
        <DeviceDetail label={deviceLabel}>
            <DeviceStatusText
                device={device}
                forceConnectionInfo={forceConnectionInfo}
                deviceNeedsRefresh={deviceNeedsRefresh}
            />
        </DeviceDetail>
    );

    return (
        <Row flex="1" gap={spacings.sm} justifyContent="center">
            {isDeviceDetailVisible ? (
                <>
                    {image}
                    {content}
                </>
            ) : (
                <Tooltip hasArrow cursor="inherit" placement="right" content={content}>
                    {image}
                </Tooltip>
            )}
        </Row>
    );
};
