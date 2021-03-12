import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { useSelector } from '@suite-hooks';
import { ConnectDevicePromptManager } from '@onboarding-components';
import PreOnboardingSetup from './components/PreOnboardingSetup';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    /* height: 480px; */
    align-items: center;
    margin-top: 20vh;

    @media all and (max-height: ${variables.SCREEN_SIZE.MD}) {
        margin-top: 5vh;
    }
    @media all and (max-height: ${variables.SCREEN_SIZE.SM}) {
        margin-top: 0vh;
    }
`;

const WelcomeStep = () => {
    const { device } = useSelector(state => ({
        device: state.suite.device,
    }));
    return (
        <Wrapper>
            <ConnectDevicePromptManager device={device}>
                {/* Happy path
                User connected uninitialized or initialized device
                Show analytics, device security/integrity check  */}
                <PreOnboardingSetup />
            </ConnectDevicePromptManager>
        </Wrapper>
    );
};

export default WelcomeStep;
