import { useEffect, useMemo } from 'react';

import { injectDesktopAnalytics } from '@suite/analytics';
import { gotoThunk } from '@suite/router';
import { events } from '@suite-common/analytics';
import { selectSelectedDevice } from '@suite-common/device';
import { selectThpStep } from '@suite-common/thp';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';
import {
    BackupTypeStep,
    CreateOrRecoverStep,
    DeviceAuthenticityStep,
    DeviceTutorialStep,
    FinalStep,
    FirmwareStep,
    PinStep,
    RecoveryStep,
    SecurityStep,
    UnexpectedState,
    getOnboardingStepIndex,
    onboardingSteps,
    useOnboarding,
    useSelector,
} from '@trezor/suite';
import { exhaustive } from '@trezor/type-utils';

import { OnboardingLayout } from './OnboardingLayout';

export const Onboarding = () => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);

    const { activeStepId } = useOnboarding();
    const device = useSelector(selectSelectedDevice);
    const thpStep = useSelector(selectThpStep);

    // This is a temporary hack until we refactor onboarding.
    // We cant include THP modals in the onboarding flow, so in this specific edge
    // we redirect user to the dashboard where onboarding starts over and picks up where it ended.
    useEffect(() => {
        if (
            activeStepId !== onboardingSteps.ID_FIRMWARE_STEP &&
            thpStep === 'ConfirmOnlyConnection'
        ) {
            dispatch(gotoThunk({ routeName: 'suite-index' }));
        }
    }, [device, thpStep, activeStepId, dispatch]);

    // Fires once per step entry. activeStepId is the dep, so it does not fire on
    // re-render and re-fires on re-entry (e.g. user navigates back and forward).
    useEffect(() => {
        analytics.report({
            type: events.onboardingStepViewedEvent.name,
            payload: {
                stepName: activeStepId,
                stepIndex: getOnboardingStepIndex(activeStepId),
                platform: 'desktop',
            },
        });
    }, [activeStepId, analytics]);

    const StepComponent = useMemo(() => {
        switch (activeStepId) {
            case onboardingSteps.ID_FIRMWARE_STEP:
                // Firmware installation
                return FirmwareStep;
            case onboardingSteps.ID_AUTHENTICATE_DEVICE_STEP:
                // Device authenticity check
                return DeviceAuthenticityStep;
            case onboardingSteps.ID_TUTORIAL_STEP:
                // Device tutorial
                return DeviceTutorialStep;
            case onboardingSteps.ID_CREATE_OR_RECOVER:
                // Selection between a new seed or seed recovery
                return CreateOrRecoverStep;
            case onboardingSteps.ID_BACKUP_TYPE_STEP:
                // Selecting a backup type
                return BackupTypeStep;
            case onboardingSteps.ID_RECOVERY_STEP:
                // b) Seed recovery
                return RecoveryStep;
            case onboardingSteps.ID_SECURITY_STEP:
                // Wallet creation + backup (resetDevice with skip_backup: false)
                return SecurityStep;
            case onboardingSteps.ID_SET_PIN_STEP:
                // Pin setup
                return PinStep;
            case onboardingSteps.ID_FINAL_STEP:
                // Onboarding success
                return FinalStep;
            default:
                return exhaustive(activeStepId);
        }
    }, [activeStepId]);

    return (
        <OnboardingLayout>
            <UnexpectedState>
                <StepComponent />
            </UnexpectedState>
        </OnboardingLayout>
    );
};
