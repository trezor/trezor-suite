import React, { useMemo, useState } from 'react';

import { OnboardingButton, OnboardingLayout } from '@onboarding-components';
import { Translation } from '@suite-components';
import {
    CheckSeedStep,
    PartiallyDoneStep,
    ContinueButton,
    RetryButton,
    ErrorImg,
    FirmwareInstallation,
    OnboardingStepBox,
    FirmwareInitial,
} from '@firmware-components';
import { useSelector, useFirmware, useOnboarding } from '@suite-hooks';
import { AcquiredDevice } from '@suite-types';
import { getFwVersion } from '@suite-utils/device';

const FirmwareStep = () => {
    const { device } = useSelector(state => ({
        device: state.suite.device,
    }));
    const { goToNextStep } = useOnboarding();
    const { status, error, resetReducer, firmwareUpdate } = useFirmware();
    const [cachedDevice, setCachedDevice] = useState<AcquiredDevice>(device as AcquiredDevice);

    // TODO: useless memo?
    const Component = useMemo(() => {
        // edge case 1 - Installation failed
        if (error) {
            return {
                Body: (
                    <OnboardingStepBox
                        heading={<Translation id="TR_FW_INSTALLATION_FAILED" />}
                        description={<Translation id="TOAST_GENERIC_ERROR" values={{ error }} />}
                        innerActions={<RetryButton onClick={firmwareUpdate} />}
                        outerActions={
                            <OnboardingButton.Back onClick={() => resetReducer()}>
                                <Translation id="TR_BACK" />
                            </OnboardingButton.Back>
                        }
                    >
                        <ErrorImg />
                    </OnboardingStepBox>
                ),
            };
        }

        // // edge case 2 - user has reconnected device that is already up to date
        if (status !== 'done' && device?.firmware === 'valid') {
            return {
                Body: (
                    <OnboardingStepBox
                        heading={<Translation id="TR_FIRMWARE_IS_UP_TO_DATE" />}
                        description={
                            <Translation
                                id="TR_FIRMWARE_INSTALLED_TEXT"
                                values={{ version: getFwVersion(device) }}
                            />
                        }
                        innerActions={<ContinueButton onClick={() => goToNextStep()} />}
                    />
                ),
            };
        }

        switch (status) {
            case 'initial':
            case 'waiting-for-bootloader': // waiting for user to reconnect in bootloader
                return {
                    Body: (
                        <FirmwareInitial
                            cachedDevice={cachedDevice}
                            setCachedDevice={setCachedDevice}
                        />
                    ),
                };
            case 'check-seed':
                // TODO: remove this case? it is only relevant in separate fw update flow and not even triggered used in onboarding
                return {
                    Body: <CheckSeedStep.Body />,
                    BottomBar: <CheckSeedStep.BottomBar />,
                };
            case 'waiting-for-confirmation': // waiting for confirming installation on a device
            case 'started': // called from firmwareUpdate()
            case 'installing':
            case 'wait-for-reboot':
            case 'unplug':
            case 'reconnect-in-normal':
            case 'done':
                return {
                    Body: <FirmwareInstallation cachedDevice={cachedDevice} />,
                };

            case 'partially-done':
                return {
                    Body: <PartiallyDoneStep.Body />,
                    BottomBar: <ContinueButton onClick={resetReducer} />,
                };
            // case 'done':
            //     return {
            //         Body: <DoneStep.Body />,
            //         BottomBar: <ContinueButton onClick={() => goToNextStep()} />,
            //     };

            default:
                // 'ensure' type completeness
                throw new Error(`state "${status}" is not handled here`);
        }
    }, [cachedDevice, device, error, status, firmwareUpdate, goToNextStep, resetReducer]);

    return Component.Body;
};

export default FirmwareStep;
