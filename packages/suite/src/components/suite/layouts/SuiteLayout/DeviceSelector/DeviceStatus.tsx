import styled from 'styled-components';

import { Image, DeviceAnimation } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/connect';
import { DeviceDetail } from 'src/views/suite/SwitchDevice/DeviceItem/DeviceDetail';
import { DeviceStatusText } from 'src/views/suite/SwitchDevice/DeviceItemLegacy/DeviceStatusText';
import { MouseEventHandler } from 'react';
import { TrezorDevice } from 'src/types/suite';
import { spacingsPx } from '@trezor/theme';

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

const StyledImage = styled(Image)`
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
                {deviceModel === DeviceModelInternal.T2B1 && (
                    <DeviceAnimation
                        type="ROTATE"
                        height="34px"
                        width="24px"
                        deviceModelInternal={deviceModel}
                        deviceUnitColor={device?.features?.unit_color}
                    />
                )}

                {deviceModel !== DeviceModelInternal.T2B1 && (
                    <StyledImage alt="Trezor" image={`TREZOR_${deviceModel}`} />
                )}
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
