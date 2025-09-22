import { useState } from 'react';

import { motion } from 'framer-motion';
import styled from 'styled-components';

import { DEFAULT_FLAGSHIP_MODEL } from '@suite-common/suite-constants';
import {
    deviceNeedsAttention,
    getDeviceInternalModel,
    getStatus,
    shouldDisplayInitialWarningIcon,
} from '@suite-common/suite-utils';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { Box, Column, Row, Select, Text, motionEasing } from '@trezor/components';
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
    const [prerequisite, setPrerequisite] = useState<ReturnType<typeof selectPrerequisite>>(
        useSelector(selectPrerequisite),
    );
    const [deviceStatus, setDeviceStatus] = useState<ReturnType<typeof getStatus> | null>(
        (device && getStatus(device)) ?? null,
    );
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

    const TestContainer = styled.div`
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        width: 100%;
        z-index: 10000;
        background: #fff;
    `;
    const Test = () => (
        <TestContainer>
            <Column gap={20}>
                <Row>
                    DeviceStatus select:
                    <Select
                        value={{ value: deviceStatus, label: deviceStatus }}
                        onChange={option => {
                            setDeviceStatus(option.value);
                            console.log('set deviceStatus', option.value);
                        }}
                        options={[
                            { value: null, label: 'None' },
                            { value: 'bootloader', label: 'Bootloader' },
                            { value: 'initialize', label: 'Initialize' },
                            { value: 'recovery', label: 'Recovery' },
                            { value: 'seedless', label: 'Seedless' },
                            { value: 'unknown', label: 'Unknown' },
                            { value: 'unreadable', label: 'Unreadable' },
                            { value: 'unacquired', label: 'Unacquired' },
                            { value: 'unacquired-requires-thp', label: 'Unacquired requires THP' },
                            { value: 'disconnected', label: 'Disconnected' },
                            { value: 'disconnect-required', label: 'Disconnect required' },
                            { value: 'firmware-missing', label: 'Firmware missing' },
                            { value: 'firmware-required', label: 'Firmware required' },
                            {
                                value: 'multi-share-backup-in-progress',
                                label: 'Multi-share backup in progress',
                            },
                        ]}
                    />
                </Row>
                <Row>
                    Prerequisite select:
                    <Select
                        value={{ value: prerequisite, label: prerequisite }}
                        onChange={option => {
                            setPrerequisite(option.value);
                            console.log('set prerequisite', option.value);
                        }}
                        options={[
                            { value: null, label: 'None' },
                            { value: 'no-transport', label: 'No transport' },
                            {
                                value: 'device-disconnect-required',
                                label: 'Device disconnect required',
                            },
                            { value: 'device-disconnected', label: 'Device disconnected' },
                            { value: 'device-unacquired', label: 'Device unacquired' },
                            {
                                value: 'device-unacquired-requires-thp',
                                label: 'Device unacquired requires THP',
                            },
                            { value: 'device-used-elsewhere', label: 'Device used elsewhere' },
                            { value: 'device-unreadable', label: 'Device unreadable' },
                            { value: 'device-unknown', label: 'Device unknown' },
                            { value: 'device-seedless', label: 'Device seedless' },
                            { value: 'device-recovery-mode', label: 'Device recovery mode' },
                            { value: 'device-initialize', label: 'Device initialize' },
                            { value: 'device-bootloader', label: 'Device bootloader' },
                            { value: 'firmware-missing', label: 'Firmware missing' },
                            { value: 'firmware-required', label: 'Firmware required' },
                            {
                                value: 'multi-share-backup-in-progress',
                                label: 'Multi-share backup in progress',
                            },
                        ]}
                    />
                </Row>
            </Column>
        </TestContainer>
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
            <Test />
        </>
    );
};
