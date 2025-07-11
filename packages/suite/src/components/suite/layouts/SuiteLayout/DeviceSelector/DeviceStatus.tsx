import { MouseEventHandler } from 'react';

import { selectDeviceLabelOrNameById } from '@suite-common/wallet-core';
import { Row, Tooltip } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/device-utils';
import { RotateDeviceImage } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import { TrezorDevice } from 'src/types/suite';
import { DeviceDetail } from 'src/views/suite/SwitchDevice/DeviceItem/DeviceDetail';
import { DeviceStatusText } from 'src/views/suite/SwitchDevice/DeviceItem/DeviceStatusText';

type DeviceStatusProps = {
    deviceModel: DeviceModelInternal;
    deviceNeedsRefresh?: boolean;
    device?: TrezorDevice;
    handleRefreshClick?: MouseEventHandler;
    forceConnectionInfo?: boolean;
    isDeviceDetailVisible?: boolean;
};

export const DeviceStatus = ({
    deviceModel,
    deviceNeedsRefresh = false,
    device,
    handleRefreshClick,
    forceConnectionInfo = false,
    isDeviceDetailVisible = true,
}: DeviceStatusProps) => {
    const deviceLabel = useSelector(state => selectDeviceLabelOrNameById(state, device?.id));

    const image = (
        <Row justifyContent="center" width={24} opacity={deviceNeedsRefresh ? 0.4 : 1}>
            <RotateDeviceImage
                deviceModel={deviceModel}
                deviceColor={device?.features?.unit_color}
                animationHeight="34px"
            />
        </Row>
    );

    const content = device && (
        <DeviceDetail label={deviceLabel}>
            <DeviceStatusText
                onRefreshClick={handleRefreshClick}
                device={device}
                forceConnectionInfo={forceConnectionInfo}
            />
        </DeviceDetail>
    );

    return (
        <Row flex="1" gap={spacings.sm}>
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
