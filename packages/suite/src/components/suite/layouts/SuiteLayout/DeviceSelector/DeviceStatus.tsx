import { MouseEventHandler } from 'react';

import styled from 'styled-components';

import { selectDeviceLabelOrNameById } from '@suite-common/wallet-core';
import { Row, Tooltip } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/connect';
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

const DeviceWrapper = styled.div<{ $isLowerOpacity: boolean }>`
    display: flex;
    opacity: ${({ $isLowerOpacity }) => $isLowerOpacity && 0.4};
`;

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
        <DeviceWrapper $isLowerOpacity={deviceNeedsRefresh}>
            <RotateDeviceImage
                deviceModel={deviceModel}
                deviceColor={device?.features?.unit_color}
                animationHeight="34px"
            />
        </DeviceWrapper>
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
        <Row flex="1" gap={spacings.md}>
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
