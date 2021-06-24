import React, { useMemo } from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { useSelector } from '@suite-hooks';
// import { ConnectDevicePromptManager } from '@onboarding-components';
import { PrerequisitesGuide } from '@suite-components';
import PreOnboardingSetup from './components/PreOnboardingSetup';
import { getPrerequisites } from '@suite-utils/prerequisites';

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

const WelcomeStep = () => {
    const { device } = useSelector(state => ({
        device: state.suite.device,
        // transport: state.suite.transport,
    }));

    const onboardingPrerequisite = useMemo(() => {
        const excluded: ReturnType<typeof getPrerequisites>[] = ['device-initialize'];

        const prerequisite = getPrerequisites({ device });

        if (!excluded.includes(prerequisite)) {
            return prerequisite;
        }
    }, [device]);

    // .filter(p => !excludedPrerequsites.includes(p))

    return (
        <Wrapper>
            {onboardingPrerequisite ? (
                <PrerequisitesGuide
                    device={device}
                    // transport={transport}
                    precondition={onboardingPrerequisite}
                />
            ) : (
                <PreOnboardingSetup />
            )}

            {/* <ConnectDevicePromptManager device={device}> */}
            {/* Happy path
                User connected uninitialized or initialized device
                Show analytics, device security/integrity check  */}
            {/* <PreOnboardingSetup /> */}
            {/* </ConnectDevicePromptManager> */}
        </Wrapper>
    );
};

export default WelcomeStep;
