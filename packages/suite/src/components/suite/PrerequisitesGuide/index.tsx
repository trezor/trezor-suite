import React from 'react';
import styled, { css } from 'styled-components';
import { variables } from '@trezor/components';
import { ConnectDevicePrompt } from '@suite-components';
import { isWebUsb } from '@suite-utils/transport';
import { getStatus, deviceNeedsAttention } from '@suite-utils/device';
import { useSelector } from '@suite-hooks';
import type { PrerequisiteType } from '@suite-types';

import Transport from './components/Transport';
import DeviceConnect from './components/DeviceConnect';
import DeviceAcquire from './components/DeviceAcquire';
import DeviceUnreadable from './components/DeviceUnreadable';
import DeviceUnknown from './components/DeviceUnknown';
import DeviceSeedless from './components/DeviceSeedless';
import DeviceRecoveryMode from './components/DeviceRecoveryMode';
import DeviceInitialize from './components/DeviceInitialize';
import DeviceBootloader from './components/DeviceBootloader';
import DeviceNoFirmware from './components/DeviceNoFirmware';
import DeviceUpdateRequired from './components/DeviceUpdateRequired';
import DeviceDisconnectRequired from './components/DeviceDisconnectRequired';

const Wrapper = styled.div<{ padded?: boolean }>`
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 700px;

    ${({ padded }) =>
        padded &&
        css`
            margin-top: 20vh;

            @media all and (max-height: ${variables.SCREEN_SIZE.MD}) {
                margin-top: 5vh;
            }

            @media all and (max-height: ${variables.SCREEN_SIZE.SM}) {
                margin-top: 0vh;
            }
        `}
`;

interface PrerequisitesGuideProps {
    prerequisite: PrerequisiteType;
    padded?: boolean;
    allowSwitchDevice?: boolean;
}

// PrerequisitesGuide is a shared component used in Preloader and Onboarding
export const PrerequisitesGuide = ({
    prerequisite,
    padded,
    allowSwitchDevice,
}: PrerequisitesGuideProps) => {
    const { device, transport, devices } = useSelector(state => ({
        device: state.suite.device,
        devices: state.devices.length,
        transport: state.suite.transport,
    }));

    const isWebUsbTransport = isWebUsb(transport);

    return (
        <Wrapper padded={padded}>
            <ConnectDevicePrompt
                connected={!!device}
                showWarning={!!(device && deviceNeedsAttention(getStatus(device)))}
                allowSwitchDevice={allowSwitchDevice && devices > 1}
                prerequisite={prerequisite}
            />
            {(() => {
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
                            <DeviceUnreadable
                                device={device}
                                isWebUsbTransport={isWebUsbTransport}
                            />
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
                        return <DeviceBootloader trezorModel={device?.features?.major_version} />;
                    case 'firmware-missing':
                        return <DeviceNoFirmware />;
                    case 'firmware-required':
                        return <DeviceUpdateRequired />;

                    default:
                        return prerequisite;
                }
            })()}
        </Wrapper>
    );
};
