import { PropsWithChildren, useMemo } from 'react';

import { motion } from 'framer-motion';
import styled from 'styled-components';

import { bluetoothActions, selectIsBluetoothListOpen } from '@suite-common/bluetooth';
import {
    deviceNeedsAttention,
    getStatus,
    shouldDisplayInitialWarningIcon,
} from '@suite-common/suite-utils';
import { selectDevices, selectSelectedDevice } from '@suite-common/wallet-core';
import {
    Button,
    Column,
    ElevationContext,
    ElevationDown,
    Flex,
    motionEasing,
} from '@trezor/components';
import { spacings } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import { ConnectDevicePrompt, Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectPrerequisite } from 'src/reducers/suite/suiteReducer';

import { DeviceAcquire } from './DeviceAcquire';
import { DeviceBootloader } from './DeviceBootloader';
import { DeviceConnect } from './DeviceConnect';
import { DeviceDisconnectRequired } from './DeviceDisconnectRequired';
import { DeviceInitialize } from './DeviceInitialize';
import { DeviceNoFirmware } from './DeviceNoFirmware';
import { DeviceRecoveryMode } from './DeviceRecoveryMode';
import { DeviceSeedless } from './DeviceSeedless';
import { DeviceUnknown } from './DeviceUnknown';
import { DeviceUnreadable } from './DeviceUnreadable';
import { DeviceUpdateRequired } from './DeviceUpdateRequired';
import { DeviceUsedElsewhere } from './DeviceUsedElsewhere';
import { MultiShareBackupInProgress } from './MultiShareBackupInProgress';
import { Transport } from './Transport';
import { BluetoothConnect } from '../bluetooth/BluetoothConnect';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;

const BottomAnimatedContainer = styled(motion.div)`
    display: flex;
`;

const BluetoothWrapper = ({ children }: PropsWithChildren) => (
    <ElevationContext baseElevation={-1}>
        {/* Here we need to draw the inner card with elevation -1 (custom design) */}
        <ElevationDown>
            <Flex width={470}>{children}</Flex>
        </ElevationDown>
    </ElevationContext>
);

type NonBluetoothProps = {
    allowSwitchDevice?: boolean;
    setIsBluetoothConnectOpen: (isOpen: boolean) => void;
};

const NonBluetooth = ({ allowSwitchDevice, setIsBluetoothConnectOpen }: NonBluetoothProps) => {
    const dispatch = useDispatch();
    const device = useSelector(selectSelectedDevice);
    const devices = useSelector(selectDevices);
    const connectedDevicesCount = devices.filter(d => d.connected === true).length;
    const prerequisite = useSelector(selectPrerequisite);

    const TipComponent = useMemo(
        () => (): React.JSX.Element => {
            switch (prerequisite) {
                case 'transport-bridge':
                    return <Transport />;
                case 'device-disconnect-required':
                    return <DeviceDisconnectRequired />;
                case 'device-disconnected':
                    return <DeviceConnect setIsBluetoothConnectOpen={setIsBluetoothConnectOpen} />;
                case 'device-unacquired':
                    return <DeviceAcquire />;
                case 'device-used-elsewhere':
                    return <DeviceUsedElsewhere />;
                case 'device-unreadable':
                    return <DeviceUnreadable device={device} />;
                case 'device-unknown':
                    return <DeviceUnknown />;
                case 'device-seedless':
                    return <DeviceSeedless />;
                case 'device-recovery-mode':
                    return <DeviceRecoveryMode />;
                case 'device-initialize':
                    return <DeviceInitialize />;
                case 'device-bootloader':
                    return <DeviceBootloader device={device} />;
                case 'firmware-missing':
                    return <DeviceNoFirmware />;
                case 'firmware-required':
                    return <DeviceUpdateRequired />;
                case 'multi-share-backup-in-progress':
                    return <MultiShareBackupInProgress />;

                case undefined:
                    return <></>;
            }
        },
        [prerequisite, device, setIsBluetoothConnectOpen],
    );

    const handleSwitchDeviceClick = () =>
        dispatch(goto('suite-switch-device', { params: { cancelable: true } }));

    const deviceStatus = (device && getStatus(device)) ?? null;

    return (
        <Column alignItems="center" gap={spacings.xxxl}>
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
                    prerequisite === 'transport-bridge'
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

interface PrerequisitesGuideProps {
    allowSwitchDevice?: boolean;
}

export const PrerequisitesGuide = ({ allowSwitchDevice }: PrerequisitesGuideProps) => {
    const isBluetoothConnectOpen = useSelector(selectIsBluetoothListOpen);
    const dispatch = useDispatch();

    const setIsBluetoothConnectOpen = () => {
        dispatch(bluetoothActions.setBluetoothListOpen({ isOpen: true }));
    };

    return (
        <Wrapper>
            {isBluetoothConnectOpen ? (
                <BluetoothWrapper>
                    <BluetoothConnect uiMode="spatial" />
                </BluetoothWrapper>
            ) : (
                <NonBluetooth
                    allowSwitchDevice={allowSwitchDevice}
                    setIsBluetoothConnectOpen={setIsBluetoothConnectOpen}
                />
            )}
        </Wrapper>
    );
};
