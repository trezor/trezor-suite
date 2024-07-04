import styled from 'styled-components';

import { DeviceModelInternal } from '@trezor/connect';
import { DeviceDetail } from 'src/views/suite/SwitchDevice/DeviceItem/DeviceDetail';
import { MouseEventHandler } from 'react';
import { TrezorDevice } from 'src/types/suite';
import { spacingsPx } from '@trezor/theme';
import { RotateDeviceImage } from '@trezor/components';
import { DeviceStatusText } from 'src/views/suite/SwitchDevice/DeviceItem/DeviceStatusText';
import { ExpandedSidebarOnly } from '../Sidebar/ExpandedSidebarOnly';
import { isCollapsedSidebar } from '../Sidebar/consts';

type DeviceStatusProps = {
    deviceModel: DeviceModelInternal;
    deviceNeedsRefresh?: boolean;
    device?: TrezorDevice;
    handleRefreshClick?: MouseEventHandler;
    forceConnectionInfo?: boolean;
};

const Container = styled.div`
    display: flex;
    gap: ${spacingsPx.md};
    flex: 1;
    align-items: center;

    @container ${isCollapsedSidebar} {
        justify-content: center;
    }
`;

const DeviceWrapper = styled.div<{ $isLowerOpacity: boolean }>`
    display: flex;
    opacity: ${({ $isLowerOpacity }) => $isLowerOpacity && 0.4};
`;

// eslint-disable-next-line local-rules/no-override-ds-component
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
    forceConnectionInfo = false,
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

            <ExpandedSidebarOnly>
                {device && (
                    <DeviceDetail label={device.label}>
                        <DeviceStatusText
                            onRefreshClick={handleRefreshClick}
                            device={device}
                            forceConnectionInfo={forceConnectionInfo}
                        />
                    </DeviceDetail>
                )}
            </ExpandedSidebarOnly>
        </Container>
    );
};
