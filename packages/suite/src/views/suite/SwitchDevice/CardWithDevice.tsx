import { ReactNode } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';
import { Card, IconName, motionAnimation, useElevation } from '@trezor/components';
import * as deviceUtils from '@suite-common/suite-utils';

import type { TrezorDevice, ForegroundAppProps } from 'src/types/suite';
import { Elevation, mapElevationToBorder, spacingsPx } from '@trezor/theme';

import { DeviceHeader } from './DeviceItem/DeviceHeader';

const Content = styled.div<{ $elevation: Elevation }>`
    padding-top: ${spacingsPx.xs};
    position: relative;

    &::before {
        height: 1px;
        content: '';
        background-color: ${({ $elevation, theme }) => mapElevationToBorder({ $elevation, theme })};
        position: absolute;
        left: -12px;
        right: -12px;
        top: 0;
    }
`;

const DeviceWrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: ${spacingsPx.xs};

    & + & {
        margin-top: ${spacingsPx.xxxl};
    }
`;

interface CardWithDeviceProps {
    children: ReactNode;
    deviceWarning?: ReactNode;
    onCancel?: ForegroundAppProps['onCancel'];
    device: TrezorDevice;
    isFullHeaderVisible?: boolean;
    isFindTrezorVisible?: boolean;
    onBackButtonClick?: () => void;
    icon?: IconName;
}

export const CardWithDevice = ({
    children,
    onCancel,
    device,
    deviceWarning,
    isFullHeaderVisible = false,
    onBackButtonClick,
    isFindTrezorVisible,
    icon,
}: CardWithDeviceProps) => {
    const deviceStatus = deviceUtils.getStatus(device);

    const needsAttention = deviceUtils.deviceNeedsAttention(deviceStatus);
    const isUnknown = device.type !== 'acquired';
    const { elevation } = useElevation();

    return (
        <Card paddingType="small" forceElevation={0}>
            <DeviceWrapper>
                <DeviceHeader
                    isFindTrezorVisible={isFindTrezorVisible}
                    onCancel={onCancel}
                    device={device}
                    isFullHeaderVisible={isFullHeaderVisible}
                    onBackButtonClick={onBackButtonClick}
                    forceConnectionInfo
                    icon={icon}
                />

                {deviceWarning}

                {!needsAttention && (
                    <AnimatePresence initial={false}>
                        {!isUnknown && (
                            <Content $elevation={elevation}>
                                <motion.div {...motionAnimation.expand}>{children}</motion.div>
                            </Content>
                        )}
                    </AnimatePresence>
                )}
            </DeviceWrapper>
        </Card>
    );
};
