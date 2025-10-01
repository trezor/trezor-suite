import { motion } from 'framer-motion';

import { DEFAULT_FLAGSHIP_MODEL } from '@suite-common/suite-constants';
import {
    deviceNeedsAttention,
    getDeviceInternalModel,
    getStatus,
    shouldDisplayInitialWarningIcon,
} from '@suite-common/suite-utils';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { Box, Column, Text, motionEasing } from '@trezor/components';
import { DeviceWithScene } from '@trezor/product-components';

import { getMessageId } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { selectPrerequisite } from 'src/selectors/suite/suiteSelectors';

import { Translation } from '../Translation';
import { BannerAndTroubleshooting } from './BannerAndTroubleshooting';

type PrerequisitesGuideProps = {
    showDeviceImage?: boolean;
};

export const PrerequisitesGuide = ({ showDeviceImage = true }: PrerequisitesGuideProps) => {
    const device = useSelector(selectSelectedDevice);
    const prerequisite = useSelector(selectPrerequisite);

    const deviceStatus = (device && getStatus(device)) ?? null;
    const selectedDevice = useSelector(selectSelectedDevice);
    const selectedDeviceModelInternal = selectedDevice
        ? getDeviceInternalModel(selectedDevice)
        : DEFAULT_FLAGSHIP_MODEL;

    const showWarning =
        !!(device && deviceStatus && deviceNeedsAttention(deviceStatus)) ||
        prerequisite === 'no-transport';
    const showWarningIcon = shouldDisplayInitialWarningIcon(deviceStatus);

    const texts = getMessageId({
        connected: !!device,
        showWarning: showWarningIcon ?? showWarning,
        deviceStatus,
        prerequisite,
    });

    const DeviceImage = () => {
        if (!showDeviceImage) return null;

        return (
            <Box margin={{ top: 40, bottom: 60 }}>
                <DeviceWithScene
                    deviceModel={selectedDeviceModelInternal}
                    unitColor={selectedDevice?.features?.unit_color}
                    height={300}
                />
            </Box>
        );
    };

    const Heading = () => (
        <Text typographyStyle="titleMedium" textWrap="balance" align="center">
            <Translation id={texts.heading} />
        </Text>
    );

    const Description = () => {
        if (!texts.description) return null;

        return (
            <Text variant="tertiary" align="center" margin={{ top: 12 }}>
                {texts.description}
            </Text>
        );
    };

    const TopAnimation = ({ children }: { children: React.ReactNode }) => (
        <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: -0 }}
            transition={{ delay: 0.2, duration: 0.4, ease: motionEasing.enter }}
            data-testid="@connect-device-prompt"
        >
            {children}
        </motion.div>
    );

    const BottomAnimation = ({ children }: { children: React.ReactNode }) => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5, ease: motionEasing.enter }}
        >
            {children}
        </motion.div>
    );

    return (
        <>
            <TopAnimation>
                <Column alignItems="center">
                    <DeviceImage />
                    <Heading />
                    <Description />
                </Column>
            </TopAnimation>
            <BottomAnimation>
                <BannerAndTroubleshooting prerequisite={prerequisite} />
            </BottomAnimation>
        </>
    );
};
