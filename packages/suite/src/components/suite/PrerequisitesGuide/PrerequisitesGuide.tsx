import { useMemo, useState } from 'react';

import { motion } from 'framer-motion';
import styled from 'styled-components';

import {
    deviceNeedsAttention,
    getStatus,
    shouldDisplayInitialWarningIcon,
} from '@suite-common/suite-utils';
import { selectDevices, selectSelectedDevice } from '@suite-common/wallet-core';
import { Button, ElevationContext, ElevationDown, Flex, motionEasing } from '@trezor/components';

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

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;

const TipsContainer = styled(motion.div)`
    display: flex;
    margin-top: 60px;
`;

const ButtonWrapper = styled.div`
    margin-top: 30px;
`;

const Bluetooth = () => (
    <ElevationContext baseElevation={-1}>
        {/* Here we need to draw the inner card with elevation -1 (custom design) */}
        <ElevationDown>
            <Flex width={470}>Here will be the Bluetooth connection dialog</Flex>
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
                    return (
                        <DeviceConnect onBluetoothClick={() => setIsBluetoothConnectOpen(true)} />
                    );
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
        <>
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

            {allowSwitchDevice && connectedDevicesCount > 1 && (
                <ButtonWrapper>
                    <Button variant="tertiary" onClick={handleSwitchDeviceClick}>
                        <Translation id="TR_SWITCH_DEVICE" />
                    </Button>
                </ButtonWrapper>
            )}

            <TipsContainer
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5, ease: motionEasing.enter }}
            >
                <TipComponent />
            </TipsContainer>
        </>
    );
};

interface PrerequisitesGuideProps {
    allowSwitchDevice?: boolean;
}

export const PrerequisitesGuide = ({ allowSwitchDevice }: PrerequisitesGuideProps) => {
    const [isBluetoothConnectOpen, setIsBluetoothConnectOpen] = useState(false);

    return (
        <Wrapper>
            {isBluetoothConnectOpen ? (
                <Bluetooth />
            ) : (
                <NonBluetooth
                    allowSwitchDevice={allowSwitchDevice}
                    setIsBluetoothConnectOpen={setIsBluetoothConnectOpen}
                />
            )}
        </Wrapper>
    );
};
