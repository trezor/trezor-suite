import { type ReactNode } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import * as deviceUtils from '@suite-common/suite-utils';
import { Card, Column, motionAnimation } from '@trezor/components';
import { spacings } from '@trezor/theme';

import type { ForegroundAppProps, TrezorDevice } from 'src/types/suite';

import { DeviceHeader } from './DeviceItem/DeviceHeader';
import { NeedsAttentionBanner } from './NeedsAttentionBanner';

type CardWithDeviceProps = {
    children: ReactNode;
    actions?: ReactNode | null;
    onCancel?: ForegroundAppProps['onCancel'];
    device: TrezorDevice;
    isFindTrezorVisible?: boolean;
    onBackButtonClick?: () => void;
    isDeviceStatusVisible?: boolean;
};

export const CardWithDevice = ({
    children,
    actions,
    onCancel,
    device,
    onBackButtonClick,
    isDeviceStatusVisible,
}: CardWithDeviceProps) => {
    const deviceStatus = deviceUtils.getStatus(device);

    const needsAttention = device.connected && deviceUtils.deviceNeedsAttention(deviceStatus);
    const isUnknown = device.type !== 'acquired';

    return (
        <Card paddingType="none">
            <Column gap={spacings.md} margin={spacings.xs}>
                <DeviceHeader
                    onCancel={onCancel}
                    device={device}
                    onBackButtonClick={onBackButtonClick}
                    isDeviceStatusVisible={isDeviceStatusVisible}
                    actions={actions}
                />

                {needsAttention && (
                    <NeedsAttentionBanner
                        device={device}
                        deviceStatus={deviceStatus}
                        onCancel={onCancel}
                    />
                )}

                {!isUnknown && (
                    <AnimatePresence initial={false}>
                        <motion.div {...motionAnimation.expand}>{children}</motion.div>
                    </AnimatePresence>
                )}
            </Column>
        </Card>
    );
};
