import { useEffect, useState } from 'react';

import { selectFlags } from '@suite/flags';
import {
    selectIsDeviceAuthenticityCheckEnabled,
    selectIsUnlockedBootloaderAllowed,
} from '@suite/settings';
import { useServices } from '@suite-common/dependency-injection';
import { deviceActions, selectDevices, selectSelectedDevice } from '@suite-common/device';
import { injectDispatch } from '@suite-common/redux-utils';
import { SUPPORTS_DEVICE_AUTHENTICITY_CHECK } from '@suite-common/suite-constants';
import { type AcquiredDevice } from '@suite-common/suite-types';
import { Box, Card } from '@trezor/components';

import { useOnboarding, useSelector } from 'src/hooks/suite';

import { DeviceAuthenticityCheck } from './DeviceAuthenticityCheck';
import { ManualDeviceCheck } from './ManualDeviceCheck';

/**
 * Orchestrator component for the two interactive device checks, i.e. the checks that need to
 * prompt the user for confirmation. They run in this sequence:
 * 1. Manual Device check (all devices)
 * 2. Device Authenticity check (only Trezor Safe devices)
 * The non-interactive checks' failure case, meanwhile, is handled by `DeviceCompromisedScreen`.
 */
export const InteractiveDeviceChecksFlow = () => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const devices = useSelector(selectDevices);
    const { initialRun } = useSelector(selectFlags);
    const isDeviceAuthenticityCheckEnabled = useSelector(selectIsDeviceAuthenticityCheckEnabled);
    const isUnlockedBootloaderAllowed = useSelector(selectIsUnlockedBootloaderAllowed);
    const { dispatch } = useServices(injectDispatch);
    const { goToSuite } = useOnboarding();
    const [isAuthenticityCheckStep, setIsAuthenticityCheckStep] = useState(false);
    const [checkedDevices, setCheckedDevices] = useState<string[]>([]);

    const isDebugDevice = (device: AcquiredDevice) =>
        isUnlockedBootloaderAllowed && device.features.bootloader_locked === false;

    const shouldAuthenticateSelectedDevice =
        !!selectedDevice?.features?.internal_model &&
        SUPPORTS_DEVICE_AUTHENTICITY_CHECK[selectedDevice.features.internal_model] &&
        initialRun &&
        isDeviceAuthenticityCheckEnabled &&
        !isDebugDevice(selectedDevice);

    // If there are multiple devices connected, check all of them before continuing to Suite.
    const goToSuiteOrNextDevice = (onSelectNext?: () => void) => {
        const nextDeviceToCheck = devices
            .filter(device => device.id !== selectedDevice?.id)
            .find(device => device.id && !checkedDevices.includes(device.id));

        if (nextDeviceToCheck !== undefined) {
            onSelectNext?.();
            setCheckedDevices(prev => [...prev, selectedDevice?.id ?? '']); // Device ID must be available as firmware is already installed.
            dispatch(deviceActions.selectDevice(nextDeviceToCheck));
        } else {
            // "Yes, I have used it before" only enters Suite, nothing is set up here.
            goToSuite({ skipDeviceSetupCompletedEvent: true });
        }
    };

    // Edge case:
    // Devices A and B are connected, only device A supports authenticity check.
    // Device A disconnects while on the first screen of the check.
    useEffect(() => {
        if (isAuthenticityCheckStep && !shouldAuthenticateSelectedDevice) {
            setIsAuthenticityCheckStep(false);
        }
    }, [isAuthenticityCheckStep, shouldAuthenticateSelectedDevice]);

    if (isAuthenticityCheckStep) {
        return (
            <Box padding={{ top: 40 }} width="100%">
                <DeviceAuthenticityCheck
                    goToNext={() => goToSuiteOrNextDevice(() => setIsAuthenticityCheckStep(false))}
                />
            </Box>
        );
    }

    const goToDeviceAuthentication = () => setIsAuthenticityCheckStep(true);

    return (
        <Card paddingType="large">
            <ManualDeviceCheck
                goToDeviceAuthentication={goToDeviceAuthentication}
                goToSuiteOrNextDevice={goToSuiteOrNextDevice}
                shouldAuthenticateSelectedDevice={shouldAuthenticateSelectedDevice}
            />
        </Card>
    );
};
