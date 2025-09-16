import { ReactNode, useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import * as deviceUtils from '@suite-common/suite-utils';
import { Box, Card, Column, Text, motionAnimation } from '@trezor/components';
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

const possibleStates = [
    'disconnected',
    'unavailable',
    'bootloader',
    'initialize',
    'seedless',
    'firmware-required',
    'used-in-other-window',
    'was-used-in-other-window',
    'firmware-recommended',
    'connected',
    'unacquired-thp-required',
    'unacquired',
    'unreadable',
    'unknown',
] as const;

type PossibleStates = (typeof possibleStates)[number];

export const CardWithDevice = ({
    children,
    actions,
    onCancel,
    device,
    onBackButtonClick,
    isFindTrezorVisible,
    isDeviceStatusVisible,
}: CardWithDeviceProps) => {
    const [deviceStatus, setDeviceStatus] = useState<PossibleStates>(deviceUtils.getStatus(device));

    useEffect(() => {
        setDeviceStatus(deviceUtils.getStatus(device));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [device.id]);

    const needsAttention = deviceUtils.deviceNeedsAttention(deviceStatus);
    const isUnknown = device.type !== 'acquired';

    return (
        <Card paddingType="none">
            <Column gap={spacings.md} margin={spacings.xs}>
                <DeviceHeader
                    isFindTrezorVisible={isFindTrezorVisible}
                    onCancel={onCancel}
                    device={device}
                    onBackButtonClick={onBackButtonClick}
                    isDeviceStatusVisible={isDeviceStatusVisible}
                    actions={actions}
                />
                <Box>
                    {possibleStates.map(s => (
                        <Box key={s} onClick={() => setDeviceStatus(s)}>
                            <Text variant={deviceStatus === s ? 'primary' : 'tertiary'}>{s}</Text>
                        </Box>
                    ))}
                </Box>
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
