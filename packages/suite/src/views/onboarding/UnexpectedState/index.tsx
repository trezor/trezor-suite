import { JSX } from 'react';

import { selectSelectedDevice } from '@suite-common/wallet-core';

import { PrerequisitesGuide } from 'src/components/suite';
import { useOnboarding, useSelector } from 'src/hooks/suite';
import { selectPrerequisite } from 'src/selectors/suite/suiteSelectors';

import { DeviceDifferent } from './DeviceDifferent';
import { ShowPinMatrix } from './ShowPinMatrix';

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
        return <DeviceDifferent />;
    }

    // otherwise handle common prerequisite which are determined and passed as prop from Preloader component
    if (prerequisite && activeStep?.prerequisites?.includes(prerequisite)) {
        return <PrerequisitesGuide />;
    }

    return children;
};
