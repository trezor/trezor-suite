import { JSX, useMemo } from 'react';

import { motion } from 'framer-motion';
import styled from 'styled-components';

import {
    deviceNeedsAttention,
    getStatus,
    shouldDisplayInitialWarningIcon,
} from '@suite-common/suite-utils';
import { selectDevices, selectSelectedDevice } from '@suite-common/wallet-core';
import { Button, Column, motionEasing } from '@trezor/components';
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
    const prerequisite = useSelector(selectPrerequisite);

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

    const deviceStatus = (device && getStatus(device)) ?? null;

    return (
        <Column alignItems="center" gap={spacings.xxxl} margin={{ vertical: 40 }}>
            {allowSwitchDevice && connectedDevicesCount > 1 && (
                <Button variant="tertiary" onClick={handleSwitchDeviceClick} icon="trezorDevices">
                    <Translation id="TR_SWITCH_DEVICE" />
                </Button>
            )}
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
