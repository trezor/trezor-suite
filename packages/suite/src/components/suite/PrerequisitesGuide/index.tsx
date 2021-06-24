import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { ConnectDevicePrompt } from '@onboarding-components';
import { isWebUSB } from '@suite-utils/transport';
import { getStatus, deviceNeedsAttention } from '@suite-utils/device';
import { useSelector } from '@suite-hooks';

import NoDeviceDetected from './components/NoDeviceDetected';
import NoTransport from './components/NoTransport';
import UnexpectedDeviceState from './components/UnexpectedDeviceState';

import type { PrerequisiteType } from '@suite-types';

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
                        return <NoTransport />;
                    case 'device-disconnected':
                        return <NoDeviceDetected offerWebUsb={isWebUSB(transport)} />;
                    case 'device-bootloader':
                    case 'device-seedless':
                    case 'device-unreadable':
                        return <UnexpectedDeviceState state={prerequisite} />;
                    case 'device-unacquired':
                        // todo:
                        return 'unacquired, should we render button directly here?';
                    case 'device-unknown':
                        // todo:
                        return 'device unknown, should not happen';
                    case 'device-initialize':
                        // todo:
                        return 'not initialized. redirect to onboarding should have happend?';

                    default:
                        return prerequisite;
                }
            })()}
        </Wrapper>
    );
};

export default PrerequisitesGuide;
