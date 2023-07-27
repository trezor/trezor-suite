import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Translation, PrerequisitesGuide } from 'src/components/suite';
import { PinMatrix } from 'src/components/suite/PinMatrix';
import { PrerequisiteType } from 'src/types/suite';
import { useOnboarding, useSelector } from 'src/hooks/suite';
import { OnboardingStepBox } from 'src/components/onboarding';
import steps from 'src/config/onboarding/steps';

import IsSameDevice from './components/IsSameDevice';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    flex-direction: column;
`;

interface Props {
    children: JSX.Element;
    prerequisite?: PrerequisiteType;
    prerequisitesGuidePadded?: boolean;
}

/**
 * This component handles unexpected device states across various steps in the onboarding.
 */
const UnexpectedState = ({ children, prerequisite, prerequisitesGuidePadded }: Props) => {
    const { device } = useSelector(s => s.suite);
    const { prevDevice, activeStepId, showPinMatrix } = useOnboarding();
    const activeStep = steps.find(s => s.id === activeStepId);
    const deviceModelInternal = device?.features?.internal_model;

    const isNotSameDevice = useMemo(() => {
        const prevDeviceId = prevDevice?.id;
        // if no device was connected before, assume it is same device
        if (!prevDeviceId) {
            return false;
        }
        const deviceId = device?.id;
        if (!deviceId) {
            // we don't know
            return null;
        }
        return deviceId !== prevDeviceId;
    }, [prevDevice, device]);

    const UnexpectedStateComponent = useMemo(() => {
        if (!activeStep?.prerequisites) return null;

        // there may be specif onboarding prerequisites
        if (activeStep?.prerequisites.includes('device-different') && isNotSameDevice) {
            // in case we can 100% detect that user reconnected different device than he had previously connected
            return <IsSameDevice />;
        }

        // otherwise handle common prerequisite which are determined and passed as prop from Preloader component
        if (prerequisite && activeStep?.prerequisites?.includes(prerequisite)) {
            return (
                <PrerequisitesGuide prerequisite={prerequisite} padded={prerequisitesGuidePadded} />
            );
        }
    }, [activeStep, prerequisite, isNotSameDevice, prerequisitesGuidePadded]);

    const getPinComponent = () => {
        // After the PIN is set it may happen that it takes too long for an user to finish the onboarding process.
        // Then the device will get auto locked and requests to show a PIN matrix next before changing its setting.
        // (which could happen on Final step where we set device name and homescreen)
        if (!device?.features) return null;
        if (activeStepId === 'set-pin') return null; // Step for setting up a PIN handles all by itself
        if (showPinMatrix) {
            return <PinMatrix device={device} />;
        }
    };

    if (!activeStep) {
        return null;
    }

    const pinComponent = getPinComponent();
    if (pinComponent) {
        return (
            <OnboardingStepBox
                heading={<Translation id="TR_ENTER_PIN" />}
                deviceModelInternal={deviceModelInternal}
                isActionAbortable={false}
            >
                {pinComponent}
            </OnboardingStepBox>
        );
    }
    if (UnexpectedStateComponent) {
        return <Wrapper>{UnexpectedStateComponent}</Wrapper>;
    }

    return children;
};

export default UnexpectedState;
