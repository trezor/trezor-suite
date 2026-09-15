import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    type AuthenticityChecksRootState,
    selectShouldCheckDeviceAuthenticity,
} from '@suite/authenticity-checks';
import { selectShouldRouterAppSkipInteractiveDeviceChecks } from '@suite/authenticity-checks';
import { selectSelectedDevice } from '@suite-common/device';
import {
    type PersistentDeviceDataRootState,
    selectDeviceNeedsManualCheck,
} from '@suite-common/persistent-device-data';
import { Box, Card } from '@trezor/components';

import { DeviceAuthenticityCheck } from './DeviceAuthenticityCheck';
import { ManualDeviceCheck } from './ManualDeviceCheck';

/**
 * Hook that determines if the Interactive Device Checks Flow should be displayed.
 * The current step (`isAuthenticityCheckStepActive`) has to be lifted up and exposed here
 * to allow for stickiness – display it declaratively, but with persistence until user progresses the UX.
 */
export const useInteractiveDeviceChecksFlowState = () => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const shouldDoManualDeviceCheck = useSelector((state: PersistentDeviceDataRootState) =>
        selectDeviceNeedsManualCheck(state, selectedDevice),
    );
    const shouldDoDeviceAuthenticityCheck = useSelector((state: AuthenticityChecksRootState) =>
        selectShouldCheckDeviceAuthenticity(state, selectedDevice),
    );
    const isSkippedRoute = useSelector(selectShouldRouterAppSkipInteractiveDeviceChecks);

    const isAnyCheckRequired = shouldDoManualDeviceCheck || shouldDoDeviceAuthenticityCheck;

    // If the MDC has been already done, but not DAC, skip straight to DAC...
    const shouldSkipMDC = !shouldDoManualDeviceCheck && shouldDoDeviceAuthenticityCheck;
    const [isAuthenticityCheckStepActive, setIsAuthenticityCheckStepActive] =
        useState(shouldSkipMDC);

    // ...and that needs to be rechecked if the device has changed in the meantime.
    useEffect(() => {
        if (shouldSkipMDC && !isAuthenticityCheckStepActive) setIsAuthenticityCheckStepActive(true);
    }, [shouldSkipMDC, isAuthenticityCheckStepActive]);

    // The flow is displayed (entered) when the checks are still required, but the DAC success screen is sticky,
    // so the flow shall be displayed until the user dismisses the DAC success.
    // Of course, if any of the checks fail, they are still required, so the failure screen sticks naturally.
    const isInteractiveDeviceChecksFlowDisplayed =
        (isAnyCheckRequired || isAuthenticityCheckStepActive) && !isSkippedRoute;

    return {
        isInteractiveDeviceChecksFlowDisplayed,
        isAuthenticityCheckStepActive,
        setIsAuthenticityCheckStepActive,
    };
};

type InteractiveDeviceChecksFlowProps = {
    isAuthenticityCheckStepActive: boolean;
    setIsAuthenticityCheckStepActive: Dispatch<SetStateAction<boolean>>;
};

/**
 * Orchestrator component for the two interactive device checks, i.e. the checks that need to
 * prompt the user for confirmation, and can be rerun again until success. They run in this sequence:
 * 1. Manual Device check: all devices. "Failure" is always immediately reversible by user action.
 * 2. Device Authenticity check: only Trezor Safe devices. Failure is persisted, but retriable by reconnecting.
 * Intended to be used together with `useInteractiveDeviceChecksFlowState`.
 * The failure case for non-interactive checks is handled by `DeviceCompromisedScreen`.
 */
export const InteractiveDeviceChecksFlow = ({
    isAuthenticityCheckStepActive,
    setIsAuthenticityCheckStepActive,
}: InteractiveDeviceChecksFlowProps) => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const shouldDoManualDeviceCheck = useSelector((state: AuthenticityChecksRootState) =>
        selectDeviceNeedsManualCheck(state, selectedDevice),
    );
    const shouldAuthenticateSelectedDevice = useSelector((state: AuthenticityChecksRootState) =>
        selectShouldCheckDeviceAuthenticity(state, selectedDevice),
    );

    /*
     Reset the flow if device A disconnected during the flow, and device B is eligible to start from the beginning.
     Note that in case device B doesn't need any checks, then this flow is simply not rendered.
    */
    const shouldResetFlow = shouldDoManualDeviceCheck && isAuthenticityCheckStepActive;
    useEffect(() => {
        if (shouldResetFlow) setIsAuthenticityCheckStepActive(false);
    }, [shouldResetFlow, setIsAuthenticityCheckStepActive]);

    const handleFinishWholeFlow = () => setIsAuthenticityCheckStepActive(false);

    if (isAuthenticityCheckStepActive) {
        return (
            <Box padding={{ top: 40 }} width="100%">
                <DeviceAuthenticityCheck onSuccess={handleFinishWholeFlow} />
            </Box>
        );
    }

    const handleFinishManualDeviceCheck = () => {
        if (shouldAuthenticateSelectedDevice) {
            setIsAuthenticityCheckStepActive(true);
        } else {
            handleFinishWholeFlow();
        }
    };

    return (
        <Card paddingType="large">
            <ManualDeviceCheck onSuccess={handleFinishManualDeviceCheck} />
        </Card>
    );
};
