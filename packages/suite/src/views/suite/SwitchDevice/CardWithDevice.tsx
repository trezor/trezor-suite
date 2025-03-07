import { ReactNode } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';

import * as deviceUtils from '@suite-common/suite-utils';
import { acquireDevice, selectDeviceThunk } from '@suite-common/wallet-core';
import { Banner, Card, IconName, motionAnimation, useElevation } from '@trezor/components';
import { Elevation, mapElevationToBorder, spacingsPx } from '@trezor/theme';

import { redirectAfterWalletSelectedThunk } from 'src/actions/wallet/addWalletThunk';
import { Translation } from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';
import type { ForegroundAppProps, TrezorDevice } from 'src/types/suite';

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
    isFullHeaderVisible = false,
    onBackButtonClick,
    isFindTrezorVisible,
    icon,
}: CardWithDeviceProps) => {
    const deviceStatus = deviceUtils.getStatus(device);

    const needsAttention = deviceUtils.deviceNeedsAttention(deviceStatus);
    const isUnknown = device.type !== 'acquired';
    const { elevation } = useElevation();

    const deviceResolveIssueCTAMessage = deviceUtils.getDeviceResolveStatusCTAMessage(deviceStatus);
    const deviceStatusBannerVariant = deviceUtils.getDeviceStatusWarningVariant(deviceStatus);
    const deviceStatusMessage = deviceUtils.getDeviceNeedsAttentionMessage(deviceStatus);
    const isLocked = useDevice().isLocked(true);
    const dispatch = useDispatch();

    const onSolveIssueClick = () => {
        const needsAcquire =
            device.type === 'unacquired' ||
            deviceStatus === 'used-in-other-window' ||
            deviceStatus === 'was-used-in-other-window';
        if (needsAcquire) {
            dispatch(acquireDevice(device));
        } else {
            dispatch(selectDeviceThunk({ device }));
            dispatch(redirectAfterWalletSelectedThunk());
            onCancel?.(false);
        }
    };

    return (
        <Card paddingType="small">
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

                {needsAttention && (
                    <Banner
                        variant={deviceStatusBannerVariant}
                        rightContent={
                            <Banner.Button
                                onClick={onSolveIssueClick}
                                data-testid="@switch-device/solve-issue-button"
                                isDisabled={isLocked}
                            >
                                <Translation id={deviceResolveIssueCTAMessage} />
                            </Banner.Button>
                        }
                    >
                        {deviceStatusMessage && <Translation id={deviceStatusMessage} />}
                    </Banner>
                )}

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
