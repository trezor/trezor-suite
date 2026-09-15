import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import {
    type AuthenticityChecksRootState,
    selectShouldCheckDeviceAuthenticity,
    selectShouldEnterInteractiveDeviceChecksOnRoute,
} from '@suite/authenticity-checks';
import { selectSelectedDevice } from '@suite-common/device';
import { selectDeviceNeedsManualCheck } from '@suite-common/persistent-device-data';
import { Box, Card } from '@trezor/components';

import { DeviceAuthenticityCheck } from './DeviceAuthenticityCheck';
import { InitializedManualDeviceCheck } from './ManualDeviceCheck';

/**
 * TODO write a nicer comment..
 * Exposes some inner state of InteractiveDeviceChecksFlow to allow for stickiness – display it declaratively, but
 * with persistence until user progresses the UX.
 */
export const useInteractiveDeviceChecksFlowState = () => {
    const shouldEnterFlow = useSelector(selectShouldEnterInteractiveDeviceChecksOnRoute);
    const [isAuthenticityCheckStepActive, setIsAuthenticityCheckStepActive] = useState(false);

    // If DAC step is active, the flow is displayed even when there is no need for it (so that the success screen sticks
    // after both checks are completed).
    const isInteractiveDeviceChecksFlowDisplayed = shouldEnterFlow || isAuthenticityCheckStepActive;

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
 * prompt the user for confirmation. They run in this sequence:
 * 1. Manual Device check (all devices)
 * 2. Device Authenticity check (only Trezor Safe devices)
 * Intended to be used together with `useInteractiveDeviceChecksFlowState`.
 * Note that the failure case for non-interactive checks is handled by `DeviceCompromisedScreen`.
 */
export const InteractiveDeviceChecksFlow = ({
    isAuthenticityCheckStepActive,
    setIsAuthenticityCheckStepActive,
}: InteractiveDeviceChecksFlowProps) => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const shouldDoManualDeviceCheck = useSelector((state: AuthenticityChecksRootState) =>
        selectDeviceNeedsManualCheck(state, selectedDevice?.id),
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

    const handleFinishWholeFlow = () => {
        setIsAuthenticityCheckStepActive(false);
        onSuccess?.();
    };

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
            <InitializedManualDeviceCheck onSuccess={handleFinishManualDeviceCheck} />
        </Card>
    );
};
