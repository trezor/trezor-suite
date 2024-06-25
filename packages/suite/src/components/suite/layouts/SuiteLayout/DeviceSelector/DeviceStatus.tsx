import styled from 'styled-components';

import { DeviceModelInternal } from '@trezor/connect';
import { DeviceDetail } from 'src/views/suite/SwitchDevice/DeviceItem/DeviceDetail';
import { MouseEventHandler } from 'react';
import { TrezorDevice } from 'src/types/suite';
import { spacingsPx } from '@trezor/theme';
import { RotateDeviceImage } from '@trezor/components';
import { DeviceStatusText } from 'src/views/suite/SwitchDevice/DeviceItem/DeviceStatusText';

type DeviceStatusProps = {
    deviceModel: DeviceModelInternal;
    deviceNeedsRefresh?: boolean;
    device?: TrezorDevice;
    handleRefreshClick?: MouseEventHandler;
    walletLabel?: string;
};

const Container = styled.div`
    display: flex;
    gap: ${spacingsPx.md};
    flex: 1;
    align-items: center;
`;

const DeviceWrapper = styled.div<{ $isLowerOpacity: boolean }>`
    display: flex;
    opacity: ${({ $isLowerOpacity }) => $isLowerOpacity && 0.4};
`;

const StyledRotateDeviceImage = styled(RotateDeviceImage)`
    width: 24px;

    /* do not apply the darkening filter in dark mode on device images */
    filter: none;
`;

export const DeviceStatus = ({
    deviceModel,
    deviceNeedsRefresh = false,
    device,
    handleRefreshClick,
    walletLabel,
}: DeviceStatusProps) => {
    return (
        <Container>
            <DeviceWrapper $isLowerOpacity={deviceNeedsRefresh}>
                <StyledRotateDeviceImage
                    deviceModel={deviceModel}
                    deviceColor={device?.features?.unit_color}
                    animationHeight="34px"
                    animationWidth="24px"
                />
            </DeviceWrapper>

            {device && (
                <DeviceDetail label={device.label}>
                    <DeviceStatusText
                        onRefreshClick={handleRefreshClick}
                        device={device}
                        walletLabel={walletLabel}
                    />
                </DeviceDetail>
            )}
        </Container>
    );
};
