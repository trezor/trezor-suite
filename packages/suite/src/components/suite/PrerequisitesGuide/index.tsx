import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { ConnectDevicePrompt } from '@suite-components';
import { isWebUSB } from '@suite-utils/transport';
import { getStatus, deviceNeedsAttention } from '@suite-utils/device';
import { useSelector } from '@suite-hooks';
import type { PrerequisiteType } from '@suite-types';

import DeviceConnect from './components/DeviceConnect';
import Transport from './components/Transport';
import DeviceUnreadable from './components/DeviceUnreadable';
import DeviceBootloader from './components/DeviceBootloader';
import DeviceSeedless from './components/DeviceSeedless';
import DeviceInitialize from './components/DeviceInitialize';
import DeviceAcquire from './components/DeviceAcquire';
import DeviceUnknown from './components/DeviceUnknown';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 20vh;

    @media all and (max-height: ${variables.SCREEN_SIZE.MD}) {
        margin-top: 5vh;
    }
    @media all and (max-height: ${variables.SCREEN_SIZE.SM}) {
        margin-top: 0vh;
    }
`;

interface Props {
    prerequisite: PrerequisiteType;
}

// todo: what if there are multiple devices connected, one of them (the selected one) with some prerequisite
// and other ready to work with? should it be possible to switch to another device?

// aka former "ConnectDevicePromptManager" from onboarding but extended
const PrerequisitesGuide = ({ prerequisite }: Props) => {
    const { device, transport } = useSelector(state => ({
        device: state.suite.device,
        transport: state.suite.transport,
    }));
    return (
        <Wrapper>
            <ConnectDevicePrompt
                connected={!!device}
                showWarning={!!(device && deviceNeedsAttention(getStatus(device)))}
            />
            {(() => {
                switch (prerequisite) {
                    case 'transport-bridge':
                        return <Transport />;
                    case 'device-disconnected':
                        return <DeviceConnect offerWebUsb={isWebUSB(transport)} />;
                    case 'device-bootloader':
                        return <DeviceBootloader />;
                    case 'device-seedless':
                        return <DeviceSeedless />;
                    case 'device-unreadable':
                        return <DeviceUnreadable />;
                    case 'device-unacquired':
                        return <DeviceAcquire />;
                    case 'device-unknown':
                        return <DeviceUnknown />;
                    case 'device-initialize':
                        return <DeviceInitialize />;
                    case 'device-recovery-mode':
                        return '';
                    default:
                        return prerequisite;
                }
            })()}
        </Wrapper>
    );
};

export default PrerequisitesGuide;
