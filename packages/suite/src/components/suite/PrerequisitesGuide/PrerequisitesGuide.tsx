import { useMemo } from 'react';

import { motion } from 'framer-motion';
import styled from 'styled-components';

import { deviceNeedsAttention, getStatus } from '@suite-common/suite-utils';
import { selectDevices, selectSelectedDevice } from '@suite-common/wallet-core';
import { Button, motionEasing } from '@trezor/components';

import { goto } from 'src/actions/suite/routerActions';
import { ConnectDevicePrompt, Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectHasTransportOfType, selectPrerequisite } from 'src/reducers/suite/suiteReducer';

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

interface PrerequisitesGuideProps {
    allowSwitchDevice?: boolean;
}

export const PrerequisitesGuide = ({ allowSwitchDevice }: PrerequisitesGuideProps) => {
    const dispatch = useDispatch();
    const device = useSelector(selectSelectedDevice);
    const devices = useSelector(selectDevices);
    const connectedDevicesCount = devices.filter(d => d.connected === true).length;
    const isWebUsbTransport = useSelector(selectHasTransportOfType('WebUsbTransport'));
    const prerequisite = useSelector(selectPrerequisite);

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
