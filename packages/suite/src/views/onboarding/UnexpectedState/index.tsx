import { JSX } from 'react';

import styled from 'styled-components';

import { selectSelectedDevice } from '@suite-common/wallet-core';

import { PrerequisitesGuide } from 'src/components/suite';
import { useOnboarding, useSelector } from 'src/hooks/suite';
import { selectPrerequisite } from 'src/selectors/suite/suiteSelectors';

// import { DeviceBusy } from './DeviceBusy';
import { DeviceDifferent } from './DeviceDifferent';
import { ShowPinMatrix } from './ShowPinMatrix';

const UnexpectedContainer = styled.div`
    margin-top: 100px;
`;

interface UnexpectedStateProps {
    children: JSX.Element;
}

/**
 * This component handles unexpected device states across various steps in the onboarding.
 */
export const UnexpectedState = ({ children }: UnexpectedStateProps) => {
    const device = useSelector(selectSelectedDevice);
    const prerequisite = useSelector(selectPrerequisite);

    const { prevDeviceId, activeStep, activeStepId, showPinMatrix } = useOnboarding();

    // device respond with Failure_Busy
    if (activeStepId !== 'firmware' && device?.status === 'busy') {
        return children;
    }

    // After the PIN is set it may happen that it takes too long for an user to finish the onboarding process.
    // Then the device will get auto locked and requests to show a PIN matrix next before changing its setting.
    // (which could happen on Final step where we set device name and homescreen)
    if (activeStepId !== 'set-pin' && showPinMatrix) {
        return <ShowPinMatrix />;
    }

    const isDeviceDifferent = prevDeviceId && device?.id && prevDeviceId !== device.id;
    // there may be specif onboarding prerequisites
    if (activeStep?.prerequisites?.includes('device-different') && isDeviceDifferent) {
        // in case we can 100% detect that user reconnected different device than he had previously connected
        return (
            <UnexpectedContainer>
                <DeviceDifferent />
            </UnexpectedContainer>
        );
    }

    // otherwise handle common prerequisite which are determined and passed as prop from Preloader component
    if (prerequisite && activeStep?.prerequisites?.includes(prerequisite)) {
        return (
            <UnexpectedContainer>
                <PrerequisitesGuide />
            </UnexpectedContainer>
        );
    }

    return children;
};
