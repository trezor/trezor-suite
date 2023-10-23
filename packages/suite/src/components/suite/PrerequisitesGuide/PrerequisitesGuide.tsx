import { useMemo } from 'react';

import styled from 'styled-components';
import { motion } from 'framer-motion';

import { getStatus, deviceNeedsAttention } from '@suite-common/suite-utils';
import { motionEasing } from '@trezor/components';
import { selectDevicesCount, selectDevice } from '@suite-common/wallet-core';

import { ConnectDevicePrompt } from 'src/components/suite';
import { isWebUsb } from 'src/utils/suite/transport';
import { useSelector } from 'src/hooks/suite';
import type { PrerequisiteType } from 'src/types/suite';

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

const Wrapper = styled.div<{ padded?: boolean }>`
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    max-width: 700px;
    margin-bottom: 66px;
`;

const TipsContainer = styled(motion.div)`
    display: flex;
`;

interface PrerequisitesGuideProps {
    prerequisite: PrerequisiteType;
    allowSwitchDevice?: boolean;
}

// PrerequisitesGuide is a shared component used in Preloader and Onboarding
export const PrerequisitesGuide = ({
    prerequisite,
    allowSwitchDevice,
}: PrerequisitesGuideProps) => {
    const device = useSelector(selectDevice);
    const devices = useSelector(selectDevicesCount);
    const transport = useSelector(state => state.suite.transport);

    const isWebUsbTransport = isWebUsb(transport);

    const TipComponent = useMemo(
        () => () => {
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
                    return (
                        <DeviceUnreadable device={device} isWebUsbTransport={isWebUsbTransport} />
                    );
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

                default:
                    return null;
            }
        },
        [prerequisite, isWebUsbTransport, device],
    );

    return (
        <Wrapper>
            <ConnectDevicePrompt
                connected={!!device}
                showWarning={!!(device && deviceNeedsAttention(getStatus(device)))}
                allowSwitchDevice={allowSwitchDevice && devices > 1}
                prerequisite={prerequisite}
            />

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
