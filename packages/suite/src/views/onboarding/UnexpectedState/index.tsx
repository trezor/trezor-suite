import { type JSX } from 'react';

import { selectShowPinMatrix } from '@suite/modal';
import {
    selectActiveStepId,
    selectOnboardingActiveStep,
    selectOnboardingPrevDeviceId,
} from '@suite/onboarding';
import { selectSelectedDevice } from '@suite-common/device';

import { useSelector } from 'src/hooks/suite';
import { selectPrerequisite } from 'src/selectors/suite/suiteSelectors';

import { DeviceDifferentStep } from './DeviceDifferentStep';
import { DeviceDisconnectedStep } from './DeviceDisconnectedStep';
import { ShowPinMatrixStep } from './ShowPinMatrixStep';

type UnexpectedStateProps = {
    children: JSX.Element;
};

/**
 * This component handles unexpected device states across various steps in the onboarding.
 */
export const UnexpectedState = ({ children }: UnexpectedStateProps) => {
    const device = useSelector(selectSelectedDevice);
    const prerequisite = useSelector(selectPrerequisite);
    const activeStep = useSelector(selectOnboardingActiveStep);
    const activeStepId = useSelector(selectActiveStepId);
    const prevDeviceId = useSelector(selectOnboardingPrevDeviceId);
    const showPinMatrix = useSelector(selectShowPinMatrix);

    // After the PIN is set it may happen that it takes too long for an user to finish the onboarding process.
    // Then the device will get auto locked and requests to show a PIN matrix next before changing its setting.
    // (which could happen on Final step where we set device name and homescreen)
    if (activeStepId !== 'set-pin' && showPinMatrix) {
        return <ShowPinMatrixStep />;
    }

    const isDeviceDifferent = prevDeviceId && device?.id && prevDeviceId !== device.id;
    // there may be specif onboarding prerequisites
    if (activeStep?.prerequisites?.includes('device-different') && isDeviceDifferent) {
        // in case we can 100% detect that user reconnected different device than he had previously connected
        return <DeviceDifferentStep />;
    }

    // otherwise handle common prerequisite which are determined and passed as prop from Preloader component
    if (prerequisite && activeStep?.prerequisites?.includes(prerequisite)) {
        return <DeviceDisconnectedStep />;
    }

    return children;
};
