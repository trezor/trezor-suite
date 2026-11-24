import { type JSX } from 'react';

import { selectRouterApp } from '@suite/router';
import { selectSelectedDevice } from '@suite-common/device';
import { selectThpStep } from '@suite-common/thp';

import { ThpPairingStep } from '#src/components/onboarding/ThpPairingStep/ThpPairingStep';
import { ID_BACKUP_TYPE_STEP, ID_CREATE_OR_RECOVER } from '#src/constants/onboarding/steps';
import { useOnboarding } from '#src/hooks/suite/useOnboarding';
import { useSelector } from '#src/hooks/suite/useSelector';
import { selectPrerequisite } from '#src/selectors/suite/suiteSelectors';

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
    const thpStep = useSelector(selectThpStep);
    const isOnboardingRoute = useSelector(selectRouterApp) === 'onboarding';

    const { isActive, prevDeviceId, activeStep, activeStepId, activeStepCategory, showPinMatrix } =
        useOnboarding();

    if (!isActive || !isOnboardingRoute) {
        return <DeviceDisconnectedStep />;
    }

    // After the PIN is set it may happen that it takes too long for an user to finish the onboarding process.
    // Then the device will get auto locked and requests to show a PIN matrix next before changing its setting.
    // (which could happen on Final step where we set device name and homescreen)
    if (activeStepId !== 'set-pin' && showPinMatrix) {
        return <ShowPinMatrixStep />;
    }

    const isDeviceDifferent = prevDeviceId && device?.id && prevDeviceId !== device.id;
    // The selected device can only become initialized during wallet creation or recovery.
    const isInitializedBeforeWalletSetup =
        device?.connected &&
        device.features?.initialized &&
        (activeStepCategory?.id === 'device' ||
            activeStepId === ID_CREATE_OR_RECOVER ||
            activeStepId === ID_BACKUP_TYPE_STEP);
    if (
        isInitializedBeforeWalletSetup ||
        (activeStep?.prerequisites?.includes('device-different') && isDeviceDifferent)
    ) {
        return <DeviceDifferentStep />;
    }

    // otherwise handle common prerequisite which are determined and passed as prop from Preloader component
    if (prerequisite && activeStep?.prerequisites?.includes(prerequisite)) {
        // ThpPairingStep renders default view. we want to show it only if thpStep is set
        if (thpStep && prerequisite === 'device-thp-locked') {
            return <ThpPairingStep />;
        }

        return <DeviceDisconnectedStep />;
    }

    return children;
};
