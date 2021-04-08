import React, { useEffect, useState } from 'react';
import { UI } from 'trezor-connect';
import { PinMatrix, Translation } from '@suite-components';
import { OnboardingButton } from '@onboarding-components';
import * as onboardingActions from '@onboarding-actions/onboardingActions';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { useActions, useSelector } from '@suite-hooks';
import PinStepBox from './PinStepBox';

const SetPinStep = () => {
    const device = useSelector(state => state.suite.device);
    const modal = useSelector(state => state.modal);
    const [status, setStatus] = useState<'initial' | 'enter-pin' | 'repeat-pin' | 'success'>(
        'initial',
    );
    const { goToNextStep, changePin } = useActions({
        goToNextStep: onboardingActions.goToNextStep,
        changePin: deviceSettingsActions.changePin,
    });

    const onTryAgain = () => {
        setStatus('initial');
        changePin({});
    };

    useEffect(() => {
        // This is where we detect requests from a device and whether the PIN functionality got enabled
        // and also set a status of the setup process accordingly
        if (device?.features) {
            // enter-pin and repeat-pin" states are set only while working with T1 (TT sends different request ButtonRequest_PinEntry).
            // They are used to show better context-aware UI/texts (Right now it only changes a header from "Set a new PIN" to "Confirm PIN").
            // As the whole process on TT is done via touchscreen we don't really need to track anything besides 'initial' and 'success' states.
            if (device.buttonRequests.includes('PinMatrixRequestType_NewFirst')) {
                if (device.buttonRequests.includes('PinMatrixRequestType_NewSecond')) {
                    setStatus('repeat-pin');
                } else {
                    setStatus('enter-pin');
                }
            }

            if (device && device.features.pin_protection) {
                setStatus('success');
            }
        }
    }, [device]);

    if (!device || !device.features) {
        return null;
    }

    // Reusing state from modal reducer to check if device requested showing a pin matrix
    // We also show the matrix on "repeat-pin" status until we'll get fail or success response from the device
    const showPinMatrix =
        (modal.context === '@modal/context-device' && modal.windowType === UI.REQUEST_PIN) ||
        status === 'repeat-pin';
    const showPinMismatch =
        modal.context === '@modal/context-user' && modal.payload.type === 'pin-mismatch'; // Set to true by T1 when user fails to enter same pin, not used at all with TT

    // First button request that will pop out of the device is "ButtonRequest_ProtectCall" (T1) or "ButtonRequest_Other" (T2), requesting us to confirm enabling PIN
    // buttonRequests will be cleared on cancelling the confirmation prompt on the device, turning this condition to false.
    const showConfirmationPrompt = device.buttonRequests.find(
        b => b === 'ButtonRequest_Other' || b === 'ButtonRequest_ProtectCall',
    );

    if (showPinMismatch) {
        // User entered 2 different PINs, show error and offer to try again
        // Used only on T1, TT shows pins mismatch error on its display
        return (
            <PinStepBox
                heading={<Translation id="TR_PIN_MISMATCH_HEADING" />}
                description={<Translation id="TR_PIN_MISMATCH_TEXT" />}
                data-test="@pin-mismatch"
                innerActions={
                    <OnboardingButton.Cta
                        onClick={onTryAgain}
                        data-test="@pin-mismatch/try-again-button"
                    >
                        <Translation id="TR_TRY_AGAIN" />
                    </OnboardingButton.Cta>
                }
            />
        );
    }

    if (status === 'success') {
        // Pin successfully set up
        return (
            <PinStepBox
                heading={<Translation id="TR_PIN_HEADING_SUCCESS" />}
                description={<Translation id="TR_PIN_SET_SUCCESS" />}
                outerActions={
                    <OnboardingButton.Cta
                        data-test="@onboarding/pin/continue-button"
                        onClick={() => goToNextStep()}
                    >
                        <Translation id="TR_CONTINUE" />
                    </OnboardingButton.Cta>
                }
            />
        );
    }

    // 'initial', 'enter-pin', 'repeat-pin' states
    return (
        <PinStepBox
            heading={
                <>
                    {status === 'initial' && <Translation id="TR_PIN_HEADING_INITIAL" />}
                    {status === 'enter-pin' && <Translation id="TR_PIN_HEADING_FIRST" />}
                    {status === 'repeat-pin' && <Translation id="TR_PIN_HEADING_REPEAT" />}
                </>
            }
            description={<Translation id="TR_PIN_SUBHEADING" />}
            innerActions={
                // "Create a pin" button to start the process, continue button after the pin is set (as outerAction), no primary CTA during the setup procedure on TT
                !showConfirmationPrompt ? (
                    <OnboardingButton.Cta
                        data-test="@onboarding/set-pin-button"
                        onClick={() => {
                            changePin();
                        }}
                    >
                        <Translation id="TR_SET_PIN" />
                    </OnboardingButton.Cta>
                ) : undefined
            }
            outerActions={
                // show skip button only if we are not done yet with setting up the pin (state is other than success state)
                // and if confirmation prompt is not active (I guess there is no point showing back btn which can't be clicked because it is under the modal)
                !showConfirmationPrompt ? (
                    <OnboardingButton.Skip
                        data-test="@onboarding/skip-button"
                        onClick={() => goToNextStep()}
                    >
                        <Translation id="TR_SKIP" />
                    </OnboardingButton.Skip>
                ) : undefined
            }
            confirmOnDevice={showConfirmationPrompt ? device.features.major_version : undefined}
        >
            {showPinMatrix && <PinMatrix device={device} />}
        </PinStepBox>
    );
};

export default SetPinStep;
