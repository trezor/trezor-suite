import { MouseEventHandler } from 'react';

import styled from 'styled-components';

import { DeviceModelInternal } from '@trezor/connect';
import { spacings } from '@trezor/theme';
import { Row } from '@trezor/components';
import { RotateDeviceImage } from '@trezor/product-components';
import { selectDeviceLabelOrNameById } from '@suite-common/wallet-core';

import { DeviceStatusText } from 'src/views/suite/SwitchDevice/DeviceItem/DeviceStatusText';
import { TrezorDevice } from 'src/types/suite';
import { DeviceDetail } from 'src/views/suite/SwitchDevice/DeviceItem/DeviceDetail';
import { useSelector } from 'src/hooks/suite';

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
    width: 24px;
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

    return (
        <Row flex="1" gap={spacings.md}>
            <DeviceWrapper $isLowerOpacity={deviceNeedsRefresh}>
                <RotateDeviceImage
                    deviceModel={deviceModel}
                    deviceColor={device?.features?.unit_color}
                    animationHeight="34px"
                    animationWidth="24px"
                />
            </DeviceWrapper>

            {isDeviceDetailVisible && device && (
                <DeviceDetail label={deviceLabel}>
                    <DeviceStatusText
                        onRefreshClick={handleRefreshClick}
                        device={device}
                        forceConnectionInfo={forceConnectionInfo}
                    />
                </DeviceDetail>
            )}
        </Row>
    );
};
