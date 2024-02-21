import { useEffect, useState } from 'react';

import { selectDevice } from '@suite-common/wallet-core';

import { PinMatrix, Translation } from 'src/components/suite';
import {
    OnboardingButtonCta,
    OnboardingButtonSkip,
    OnboardingStepBox,
    SkipStepConfirmation,
} from 'src/components/onboarding';
import { changePin } from 'src/actions/settings/deviceSettingsActions';
import { useDispatch, useSelector, useOnboarding } from 'src/hooks/suite';
import { selectIsActionAbortable } from 'src/reducers/suite/suiteReducer';

const SetPinStep = () => {
    const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);
    const [status, setStatus] = useState<'initial' | 'enter-pin' | 'repeat-pin' | 'success'>(
        'initial',
    );
    const device = useSelector(selectDevice);
    const modal = useSelector(state => state.modal);
    const isActionAbortable = useSelector(selectIsActionAbortable);
    const dispatch = useDispatch();

    const { goToNextStep, showPinMatrix, updateAnalytics } = useOnboarding();

    const setPinAndSkipSuccessToast = () => dispatch(changePin({}, true));
    const onTryAgain = () => {
        setStatus('initial');
        setPinAndSkipSuccessToast();
    };
    const setPin = () => {
        setPinAndSkipSuccessToast();
        updateAnalytics({ pin: 'create' });
    };
    const skipPin = () => {
        setShowSkipConfirmation(true);
        updateAnalytics({ pin: 'skip' });
    };

    useEffect(() => {
        // This is where we detect requests from a device, figure out whether the PIN functionality got enabled,
        // and set a status of the setup process accordingly
        if (device?.features) {
            // enter-pin and repeat-pin" states are set only while working with T1B1 (T2T1 sends different request ButtonRequest_PinEntry and everything is done in touchscreen).
            // They are used to show better context-aware UI/texts (Right now it only changes a header from "Set a new PIN" to "Confirm PIN").
            // As the whole process on T2T1 is done via touchscreen we don't really need to track anything besides 'initial' and 'success' states.
            const buttonRequests = device.buttonRequests.map(r => r.code);
            if (buttonRequests.includes('PinMatrixRequestType_NewFirst')) {
                if (buttonRequests.includes('PinMatrixRequestType_NewSecond')) {
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

    const showPinMismatch =
        modal.context === '@modal/context-user' && modal.payload.type === 'pin-mismatch'; // Set to true by T1B1 when user fails to enter same pin, not used at all with T2T1

    // First button request that will pop out of the device is "ButtonRequest_ProtectCall" (T1B1) or "ButtonRequest_Other" (T2T1/T2B1), requesting us to confirm enabling PIN
    // buttonRequests will be cleared on cancelling the confirmation prompt on the device, turning this condition to false.
    const showConfirmationPrompt = device.buttonRequests.find(
        b => b.code === 'ButtonRequest_Other' || b.code === 'ButtonRequest_ProtectCall',
    );

    if (showPinMismatch) {
        // User entered 2 different PINs, show error and offer to try again
        // Used only on T1B1, T2T1 shows pins mismatch error on its display
        return (
            <OnboardingStepBox
                image="PIN"
                key="pin-mismatch" // to properly rerender in translation mode
                heading={<Translation id="TR_PIN_MISMATCH_HEADING" />}
                data-test-id="@pin-mismatch"
                innerActions={
                    <OnboardingButtonCta
                        onClick={onTryAgain}
                        data-test-id="@pin-mismatch/try-again-button"
                    >
                        <Translation id="TR_TRY_AGAIN" />
                    </OnboardingButtonCta>
                }
            />
        );
    }

    if (status === 'success') {
        // Pin successfully set up
        return (
            <OnboardingStepBox
                image="PIN"
                key={status} // to properly rerender in translation mode
                heading={<Translation id="TR_PIN_HEADING_SUCCESS" />}
                description={<Translation id="TR_PIN_SET_SUCCESS" />}
                outerActions={
                    <OnboardingButtonCta
                        data-test-id="@onboarding/pin/continue-button"
                        onClick={() => goToNextStep()}
                    >
                        <Translation id="TR_CONTINUE" />
                    </OnboardingButtonCta>
                }
            />
        );
    }

    // 'initial', 'enter-pin', 'repeat-pin' states
    return (
        <>
            {showSkipConfirmation && (
                <SkipStepConfirmation onCancel={() => setShowSkipConfirmation(false)} />
            )}
            <OnboardingStepBox
                image="PIN"
                key={status} // to properly rerender in translation mode
                heading={
                    <>
                        {status === 'initial' && <Translation id="TR_PIN_HEADING_INITIAL" />}
                        {status === 'enter-pin' && <Translation id="TR_PIN_HEADING_FIRST" />}
                        {status === 'repeat-pin' && <Translation id="TR_PIN_HEADING_REPEAT" />}
                    </>
                }
                description={<Translation id="TR_PIN_SUBHEADING" />}
                innerActions={
                    // "Create a pin" button to start the process, continue button after the pin is set (as outerAction), no primary CTA during the setup procedure on T2T1
                    !showConfirmationPrompt ? (
                        <OnboardingButtonCta
                            data-test-id="@onboarding/set-pin-button"
                            onClick={setPin}
                        >
                            <Translation id="TR_SET_PIN" />
                        </OnboardingButtonCta>
                    ) : undefined
                }
                outerActions={
                    // show skip button only if we are not done yet with setting up the pin (state is other than success state)
                    // and if confirmation prompt is not active (I guess there is no point showing back btn which can't be clicked because it is under the modal)
                    !showConfirmationPrompt ? (
                        <OnboardingButtonSkip
                            data-test-id="@onboarding/skip-button"
                            onClick={skipPin}
                        >
                            <Translation id="TR_SKIP" />
                        </OnboardingButtonSkip>
                    ) : undefined
                }
                device={showConfirmationPrompt ? device : undefined}
                isActionAbortable={status === 'initial' ? isActionAbortable : true}
            >
                {/* // device requested showing a pin matrix, show the matrix also on "repeat-pin" status until we get fail or success response from the device */}
                {(showPinMatrix || status === 'repeat-pin') && <PinMatrix device={device} />}
            </OnboardingStepBox>
        </>
    );
};

export default SetPinStep;
