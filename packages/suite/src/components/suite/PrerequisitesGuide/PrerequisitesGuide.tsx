import { JSX, useMemo, useState } from 'react';

import { motion } from 'framer-motion';
import styled from 'styled-components';

import {
    deviceNeedsAttention,
    getStatus,
    shouldDisplayInitialWarningIcon,
} from '@suite-common/suite-utils';
import { selectDevices, selectSelectedDevice } from '@suite-common/wallet-core';
import { Button, Column, Row, Select, motionEasing } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import { ConnectDevicePrompt, Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectPrerequisite } from 'src/selectors/suite/suiteSelectors';

import { DeviceAcquire } from './DeviceAcquire';
import { DeviceBootloader } from './DeviceBootloader';
import { DeviceConnect } from './DeviceConnect';
import { DeviceDisconnectRequired } from './DeviceDisconnectRequired';
import { DeviceInitialize } from './DeviceInitialize';
import { DeviceNoFirmware } from './DeviceNoFirmware';
import { DeviceRecoveryMode } from './DeviceRecoveryMode';
import { DeviceSeedless } from './DeviceSeedless';
import { DeviceTrezorHostProtocolPair } from './DeviceTrezorHostProtocolPair';
import { DeviceUnknown } from './DeviceUnknown';
import { DeviceUnreadable } from './DeviceUnreadable';
import { DeviceUpdateRequired } from './DeviceUpdateRequired';
import { DeviceUsedElsewhere } from './DeviceUsedElsewhere';
import { MultiShareBackupInProgress } from './MultiShareBackupInProgress';
import { NoTransport } from './NoTransport';

const BottomAnimatedContainer = styled(motion.div)`
    display: flex;
`;

type PrerequisitesGuideProps = {
    allowSwitchDevice?: boolean;
};

export const PrerequisitesGuide = ({ allowSwitchDevice }: PrerequisitesGuideProps) => {
    const dispatch = useDispatch();
    const device = useSelector(selectSelectedDevice);
    const devices = useSelector(selectDevices);
    const connectedDevicesCount = devices.filter(d => d.connected === true).length;
    const [prerequisite, setPrerequisite] = useState<ReturnType<typeof selectPrerequisite>>(
        useSelector(selectPrerequisite),
    );

    const TipComponent = useMemo(
        () => (): JSX.Element => {
            switch (prerequisite) {
                case 'no-transport':
                    return <NoTransport />;
                case 'device-disconnect-required':
                    return <DeviceDisconnectRequired />;
                case 'device-disconnected':
                    return <DeviceConnect />;
                case 'device-unacquired':
                    return <DeviceAcquire />;
                case 'device-unacquired-requires-thp':
                    return <DeviceTrezorHostProtocolPair />;
                case 'device-used-elsewhere':
                    return <DeviceUsedElsewhere />;
                case 'device-unreadable':
                    return <DeviceUnreadable />;
                case 'device-unknown':
                    return <DeviceUnknown />;
                case 'device-seedless':
                    return <DeviceSeedless />;
                case 'device-recovery-mode':
                    return <DeviceRecoveryMode />;
                case 'device-initialize':
                    return <DeviceInitialize />;
                case 'device-bootloader':
                    return <DeviceBootloader />;
                case 'firmware-missing':
                    return <DeviceNoFirmware />;
                case 'firmware-required':
                    return <DeviceUpdateRequired />;
                case 'multi-share-backup-in-progress':
                    return <MultiShareBackupInProgress />;
                default:
                    return <></>;
            }
        },
        [prerequisite],
    );

    const handleSwitchDeviceClick = () =>
        dispatch(goto('suite-switch-device', { params: { cancelable: true } }));

    const [deviceStatus, setDeviceStatus] = useState<ReturnType<typeof getStatus> | null>(
        (device && getStatus(device)) ?? null,
    );

    console.log('current deviceStatus', deviceStatus);
    console.log('current prerequisite', prerequisite);

    return (
        <Column alignItems="center" gap={spacings.xxxl} margin={{ vertical: 40 }}>
            {allowSwitchDevice && connectedDevicesCount > 1 && (
                <Button variant="tertiary" onClick={handleSwitchDeviceClick} icon="trezorDevices">
                    <Translation id="TR_SWITCH_DEVICE" />
                </Button>
            )}
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

            <ConnectDevicePrompt
                connected={!!device}
                deviceStatus={deviceStatus}
                showWarning={
                    !!(device && deviceStatus && deviceNeedsAttention(deviceStatus)) ||
                    prerequisite === 'no-transport'
                }
                showWarningIcon={shouldDisplayInitialWarningIcon(deviceStatus)}
                prerequisite={prerequisite}
            />
            <BottomAnimatedContainer
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5, ease: motionEasing.enter }}
            >
                <Column alignItems="center" justifyContent="center" gap={spacings.xxxxl}>
                    <TipComponent />
                </Column>
            </BottomAnimatedContainer>
        </Column>
    );
};
