import { ReactNode } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import * as deviceUtils from '@suite-common/suite-utils';
import { Card, Column, motionAnimation } from '@trezor/components';
import { spacings } from '@trezor/theme';

import type { ForegroundAppProps, TrezorDevice } from 'src/types/suite';

import { DeviceHeader } from './DeviceItem/DeviceHeader';
import { NeedsAttentionBanner } from './NeedsAttentionBanner';

type CardWithDeviceProps = {
    children: ReactNode;
    onCancel?: ForegroundAppProps['onCancel'];
    device: TrezorDevice;
    isFullHeaderVisible?: boolean;
    isFindTrezorVisible?: boolean;
    onBackButtonClick?: () => void;
};

export const CardWithDevice = ({
    children,
    onCancel,
    device,
    isFullHeaderVisible = false,
    onBackButtonClick,
    isFindTrezorVisible,
}: CardWithDeviceProps) => {
    const deviceStatus = deviceUtils.getStatus(device);

    const needsAttention = deviceUtils.deviceNeedsAttention(deviceStatus);
    const isUnknown = device.type !== 'acquired';

    return (
        <Card paddingType="none">
            <Column gap={spacings.md} margin={spacings.xs}>
                <DeviceHeader
                    isFindTrezorVisible={isFindTrezorVisible}
                    onCancel={onCancel}
                    device={device}
                    isFullHeaderVisible={isFullHeaderVisible}
                    onBackButtonClick={onBackButtonClick}
                    forceConnectionInfo
                />

                {needsAttention && (
                    <NeedsAttentionBanner
                        device={device}
                        deviceStatus={deviceStatus}
                        onCancel={onCancel}
                    />
                )}

                {!needsAttention && (
                    <AnimatePresence initial={false}>
                        {!isUnknown && (
                            <motion.div {...motionAnimation.expand}>{children}</motion.div>
                        )}
                    </AnimatePresence>
                )}
            </Column>
        </Card>
    );
};
