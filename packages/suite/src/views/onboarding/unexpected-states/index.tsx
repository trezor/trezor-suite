import React from 'react';
import styled from 'styled-components';
import { Translation, PinMatrix, PrerequisitesGuide } from '@suite-components';
import { PrerequisiteType } from '@suite-types';
import { useOnboarding, useSelector } from '@suite-hooks';
import { OnboardingStepBox } from '@onboarding-components';
import steps from '@onboarding-config/steps';

// import { Step } from '@onboarding-types';
// import * as STEP from '@onboarding-constants/steps';

// todo: replace ?

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    flex-direction: column;
    margin-top: 40px;
`;

// const IsInBootloader = () => (
//     <OnboardingStepBox
//         disableConfirmWrapper
//         description={<Translation id="TR_CONNECTED_DEVICE_IS_IN_BOOTLOADER" />}
//     />
// );

interface Props {
    children: JSX.Element;
    prerequisite?: PrerequisiteType;
}
/**
 * This component handles unexpected device states across various steps in the onboarding.
 */
const UnexpectedState = ({ children, prerequisite }: Props) => {
    console.log('unexpected state prerequisite', prerequisite);

    const { device } = useSelector(s => s.suite);
    const { /* prevDevice , */ activeStepId, showPinMatrix } = useOnboarding();
    const activeStep = steps.find(s => s.id === activeStepId);

    // const isNotSameDevice = () => {
    //     const prevDeviceId = prevDevice && prevDevice.features && prevDevice.id;
    //     // if no device was connected before, assume it is same device
    //     if (!prevDeviceId) {
    //         return false;
    //     }
    //     const deviceId = device && device.features && device.id;
    //     if (!deviceId) {
    //         return null;
    //     }
    //     return deviceId !== prevDeviceId;
    // };

    if (!activeStep) {
        return null;
    }

    // const isStepDisallowed = (state: Required<Step>['disallowedDeviceStates'][number]) => {
    //     switch (state) {
    //         case STEP.DISALLOWED_DEVICE_IS_NOT_CONNECTED:
    //             return !device;
    //         case STEP.DISALLOWED_IS_NOT_SAME_DEVICE:
    //             return isNotSameDevice();
    //         case STEP.DISALLOWED_DEVICE_IS_IN_BOOTLOADER:
    //             return device?.features && device.mode === 'bootloader';
    //         case STEP.DISALLOWED_DEVICE_IS_NOT_USED_HERE:
    //             return device?.type === 'unacquired';
    //         case STEP.DISALLOWED_DEVICE_IS_IN_RECOVERY_MODE:
    //             return device?.features?.recovery_mode;
    //         default:
    //             return null;
    //     }
    // };

    // const disallowedState = activeStep?.disallowedDeviceStates?.find(state =>
    //     isStepDisallowed(state),
    // );

    const getUnexpectedStateComponent = () => {
        // first handle common prerequisite
        if (prerequisite && activeStep.prerequisites?.includes(prerequisite)) {
            return <PrerequisitesGuide prerequisite={prerequisite} />;
        }

        // onboarding specific prereq
        // switch (disallowedState) {
        //     case STEP.DISALLOWED_IS_NOT_SAME_DEVICE:
        //         return <IsSameDevice />;
        //     case STEP.DISALLOWED_DEVICE_IS_IN_RECOVERY_MODE:
        //         // I don't know how this case could be triggered (and right now I don't believe it can be), thus design is ugly.
        //         // To whoever find this in the future and will need to implement proper design, I am sorry.
        //         return (
        //             <OnboardingStepBox
        //                 disableConfirmWrapper
        //                 heading={<Translation id="TR_DEVICE_IN_RECOVERY_MODE" />}
        //             />
        //         );
        //     default:
        //         return null;
        // }

        return null;
    };

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

    const pinComponent = getPinComponent();
    const unexpectedState = getUnexpectedStateComponent();
    if (pinComponent) {
        return (
            <OnboardingStepBox
                heading={<Translation id="TR_ENTER_PIN" />}
                confirmOnDevice={device?.features?.major_version === 1 ? 1 : 2}
            >
                {pinComponent}
            </OnboardingStepBox>
        );
    }
    if (unexpectedState) {
        return (
            <Wrapper>
                {/* <ConnectDevicePrompt connected={!!device?.connected} showWarning>
                    {disallowedState === 'device-is-not-connected' ? (
                        <Translation id="TR_RECONNECT_HEADER" />
                    ) : undefined}
                </ConnectDevicePrompt> */}
                {unexpectedState}
            </Wrapper>
        );
    }
    return children;
};

export default UnexpectedState;
