import React from 'react';
import styled from 'styled-components';

import { TrezorDevice } from '@suite/types/suite';
import { TransportInfo } from 'trezor-connect';
import { variables } from '@trezor/components';

import * as TIPS from '@suite/components/suite/TroubleshootingTips/tips';
import { ConnectDevicePrompt } from '@suite/components/onboarding';

import NoDeviceDetected from './components/NoDeviceDetected';
import NoTransport from './components/NoTransport';
import UnexpectedDeviceState from './components/UnexpectedDeviceState';

import { getPrerequisites } from '@suite/utils/suite/prerequisites';
import { getStatus, deviceNeedsAttention } from '@suite-utils/device';

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
    transport: Partial<TransportInfo>
    precondition: ReturnType<typeof getPrerequisites>;
}


// aka former "ConnectDevicePromptManager" from onboarding but extended
const PrerequisitesGuide = (props: Props) => {
    const { device, transport, precondition } = props;

    return (
        <Wrapper>
            <ConnectDevicePrompt connected={!!device} showWarning={!!(device && deviceNeedsAttention(getStatus(device)))} />
            {
                (() => {
                    switch (precondition) {
                        case 'transport-bridge':
                            return <NoTransport />
                        case 'device-disconnected':
                            return <NoDeviceDetected offerWebUsb={false} />
                        case 'device-bootloader':
                        case 'device-seedless':
                        case 'device-unreadable':
                            return <UnexpectedDeviceState deviceStatus={getStatus(device!)} />
                        case 'device-unacquired':
                            // todo:
                            return 'unacquired, should we render button directly here?'
                        case 'device-unknown':
                            // todo:
                            return "device unknown, should not happen"
                        case 'device-initialize':
                            // todo:
                            return "not initialized. redirect to onboarding should have happend?"

                        default:
                            return precondition
                    }
                })()
            }
        </Wrapper>
    )
}

export default PrerequisitesGuide;