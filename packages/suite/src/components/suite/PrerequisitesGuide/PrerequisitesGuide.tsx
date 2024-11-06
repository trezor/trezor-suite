import { useMemo } from 'react';

import styled from 'styled-components';
import { motion } from 'framer-motion';

import { getStatus, deviceNeedsAttention } from '@suite-common/suite-utils';
import { Button, motionEasing } from '@trezor/components';
import { selectDevices, selectDevice } from '@suite-common/wallet-core';

import { ConnectDevicePrompt, Translation } from 'src/components/suite';
import { isWebUsb } from 'src/utils/suite/transport';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectPrerequisite } from 'src/reducers/suite/suiteReducer';
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
    const dispatch = useDispatch();
    const device = useSelector(selectDevice);
    const devices = useSelector(selectDevices);
    const connectedDevicesCount = devices.filter(d => d.connected === true).length;
    const transport = useSelector(state => state.suite.transport);
    const prerequisite = useSelector(selectPrerequisite);

    const isWebUsbTransport = isWebUsb(transport);

    const TipComponent = useMemo(
        () => (): React.JSX.Element => {
            switch (prerequisite) {
                case 'transport-bridge':
                    return <Transport />;
                case 'device-disconnect-required':
                    return <DeviceDisconnectRequired />;
                case 'device-disconnected':
                    return <DeviceConnect isWebUsbTransport={isWebUsbTransport} />;
                case 'device-unacquired':
                    return <DeviceAcquire />;
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
        [prerequisite, isWebUsbTransport, device],
    );

    const handleSwitchDeviceClick = () =>
        dispatch(goto('suite-switch-device', { params: { cancelable: true } }));

    return (
        <Wrapper>
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
        </Wrapper>
    );
};
