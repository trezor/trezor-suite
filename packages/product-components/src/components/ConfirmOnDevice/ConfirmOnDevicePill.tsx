import React, { type ReactNode } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from 'styled-components';

import { Box } from '@trezor/components';
import { type DeviceModelInternal } from '@trezor/device-utils';

import { ConfirmOnDevicePillContent } from './ConfirmOnDevicePillContent';

const INITIAL_STATE = { opacity: 0, y: '50%' };

export type ConfirmOnDeviceProps = {
    title: ReactNode;
    successText?: ReactNode;
    steps?: number;
    activeStep?: number;
    isConfirmed?: boolean;
    onCancel?: () => void;
    deviceModelInternal?: DeviceModelInternal;
    deviceUnitColor?: number;
};

export const ConfirmOnDevicePill = ({ isConfirmed, ...props }: ConfirmOnDeviceProps) => {
    const theme = useTheme();

    const isCancelable = !!props.onCancel;

    return (
        <AnimatePresence>
            <motion.div
                initial={INITIAL_STATE}
                animate={isConfirmed ? INITIAL_STATE : { opacity: 1, y: 0 }}
                exit={INITIAL_STATE}
                transition={{
                    duration: 0.6,
                    ease: [0.16, 1, 0.3, 1],
                }}
            >
                <Box
                    backgroundColor="surfaceFillModeless"
                    padding={isCancelable ? 16 : { vertical: 16, left: 16, right: 24 }}
                    borderRadius={20}
                    borderWidth={1}
                    borderColor="surfaceBorderModeless"
                    // TODO: Use new shadow tokens
                    shadow={theme.boxShadowElevated}
                    data-testid="@prompts/confirm-on-device"
                    onClick={e => e.stopPropagation()}
                    width="fit-content"
                >
                    <ConfirmOnDevicePillContent {...props} />
                </Box>
            </motion.div>
        </AnimatePresence>
    );
};
