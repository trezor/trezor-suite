import { useMemo, useState } from 'react';

import styled from 'styled-components';
import { motion } from 'framer-motion';

import { getStatus, deviceNeedsAttention } from '@suite-common/suite-utils';
import { Button, ElevationContext, ElevationDown, Flex, motionEasing } from '@trezor/components';
import { selectDevices, selectDevice } from '@suite-common/wallet-core';

import { ConnectDevicePrompt, Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import {
    selectIsWebUsb,
    selectIsBluetooth,
    selectPrerequisite,
} from 'src/reducers/suite/suiteReducer';
import { goto } from 'src/actions/suite/routerActions';

import { Transport } from './Transport';
import { DeviceConnect } from './DeviceConnect';
import { DeviceAcquire } from './DeviceAcquire';
import { DeviceUnreadable } from './DeviceUnreadable';
import { DeviceUnknown } from './DeviceUnknown';
import { DeviceSeedless } from './DeviceSeedless';
import { DeviceRecoveryMode } from './DeviceRecoveryMode';
import { DeviceInitialize } from './DeviceInitialize';
import { DeviceBootloader } from './DeviceBootloader';
import { DeviceNoFirmware } from './DeviceNoFirmware';
import { DeviceUpdateRequired } from './DeviceUpdateRequired';
import { DeviceDisconnectRequired } from './DeviceDisconnectRequired';
import { MultiShareBackupInProgress } from './MultiShareBackupInProgress';
import { DeviceUsedElsewhere } from './DeviceUsedElsewhere';
import { BluetoothConnect } from '../bluetooth/BluetoothConnect';

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

interface PrerequisitesGuideProps {
    allowSwitchDevice?: boolean;
}

export const PrerequisitesGuide = ({ allowSwitchDevice }: PrerequisitesGuideProps) => {
    const [isBluetoothConnectOpen, setIsBluetoothConnectOpen] = useState(false);

    const dispatch = useDispatch();

    const device = useSelector(selectDevice);
    const devices = useSelector(selectDevices);
    const connectedDevicesCount = devices.filter(d => d.connected === true).length;
    const isWebUsbTransport = useSelector(selectIsWebUsb);
    const isBluetooth = useSelector(selectIsBluetooth);
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
                        <DeviceConnect
                            isWebUsbTransport={isWebUsbTransport}
                            isBluetooth={isBluetooth}
                            onBluetoothClick={() => setIsBluetoothConnectOpen(true)}
                        />
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
        [prerequisite, isWebUsbTransport, isBluetooth, device],
    );

    const handleSwitchDeviceClick = () =>
        dispatch(goto('suite-switch-device', { params: { cancelable: true } }));

    return (
        <Wrapper>
            {isBluetoothConnectOpen ? (
                <ElevationContext baseElevation={-1}>
                    {/* Here we need to draw the inner card with elevation -1 (custom design) */}
                    <ElevationDown>
                        <Flex width={470}>
                            <BluetoothConnect
                                onClose={() => setIsBluetoothConnectOpen(false)}
                                uiMode="spatial"
                            />
                        </Flex>
                    </ElevationDown>
                </ElevationContext>
            ) : (
                <>
                    <ConnectDevicePrompt
                        connected={!!device}
                        showWarning={
                            !!(device && deviceNeedsAttention(getStatus(device))) ||
                            prerequisite === 'transport-bridge'
                        }
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
            )}
        </Wrapper>
    );
};
