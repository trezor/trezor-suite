import React from 'react';
import styled from 'styled-components';

import { TrezorDevice } from '@suite/types/suite';
// import { TransportInfo } from 'trezor-connect';
import { variables } from '@trezor/components';

import { ConnectDevicePrompt } from '@onboarding-components';
import { getPrerequisites } from '@suite-utils/prerequisites';
import { getStatus, deviceNeedsAttention } from '@suite-utils/device';

import NoDeviceDetected from './components/NoDeviceDetected';
import NoTransport from './components/NoTransport';
import UnexpectedDeviceState from './components/UnexpectedDeviceState';

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
    device?: TrezorDevice;
    // transport: Partial<TransportInfo>;
    precondition: ReturnType<typeof getPrerequisites>;
}

// aka former "ConnectDevicePromptManager" from onboarding but extended
const PrerequisitesGuide = (props: Props) => {
    const {
        device,
        // transport,
        // todo: we wil see if we need to have this as param or not, maybe onboarding will be the same
        precondition,
    } = props;

    return (
        <Wrapper>
            <ConnectDevicePrompt
                connected={!!device}
                showWarning={!!(device && deviceNeedsAttention(getStatus(device)))}
            />
            {(() => {
                switch (precondition) {
                    case 'transport-bridge':
                        return <NoTransport />;
                    case 'device-disconnected':
                        return <NoDeviceDetected offerWebUsb={false} />;
                    case 'device-bootloader':
                    case 'device-seedless':
                    case 'device-unreadable':
                        return <UnexpectedDeviceState state={precondition} />;
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
                        return precondition;
                }
            })()}
        </Wrapper>
    );
};

export default PrerequisitesGuide;
