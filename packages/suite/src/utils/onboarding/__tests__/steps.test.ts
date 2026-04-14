import type { AcquiredDevice } from '@suite-common/suite-types';
import { DeviceModelInternal } from '@trezor/device-utils';

import { stepCategories } from 'src/config/onboarding/steps';
import * as STEP from 'src/constants/onboarding/steps';

import { type IsStepUsedProps, findNextStep, findPrevStep, isStepUsed } from '../steps';

const allSteps = stepCategories.flatMap(category => category.steps);

const createDevice = (overrides: Partial<AcquiredDevice['features']>) =>
    ({
        features: {
            internal_model: DeviceModelInternal.T2T1,
            ...overrides,
        },
    }) as AcquiredDevice;

const defaultDevice = createDevice({ internal_model: DeviceModelInternal.T2T1 });

const createProps = (overrides?: Partial<IsStepUsedProps>): IsStepUsedProps => ({
    onboardingPath: [],
    device: defaultDevice,
    isDeviceAuthenticityCheckEnabled: true,
    isUnlockedBootloaderAllowed: false,
    ...overrides,
});

const getStepsForPath = (path: typeof STEP.PATH_CREATE | typeof STEP.PATH_RECOVERY) =>
    allSteps.filter(step =>
        isStepUsed(step, createProps({ onboardingPath: [path], device: defaultDevice })),
    );

describe('steps', () => {
    describe('real onboarding flow - create wallet (T2T1)', () => {
        const createSteps = getStepsForPath(STEP.PATH_CREATE);

        it('should contain the expected steps for T2T1 create flow', () => {
            const stepIds = createSteps.map(s => s.id);
            expect(stepIds).toEqual([
                STEP.ID_FIRMWARE_STEP,
                STEP.ID_CREATE_OR_RECOVER,
                STEP.ID_RESET_DEVICE_STEP,
                STEP.ID_SECURITY_STEP,
                STEP.ID_SET_PIN_STEP,
                STEP.ID_COINS_STEP,
            ]);
        });

        it('should navigate through the full create flow', () => {
            expect(findNextStep(STEP.ID_FIRMWARE_STEP, createSteps, defaultDevice)?.id).toBe(
                STEP.ID_CREATE_OR_RECOVER,
            );
            expect(findNextStep(STEP.ID_CREATE_OR_RECOVER, createSteps, defaultDevice)?.id).toBe(
                STEP.ID_RESET_DEVICE_STEP,
            );
            expect(findNextStep(STEP.ID_RESET_DEVICE_STEP, createSteps, defaultDevice)?.id).toBe(
                STEP.ID_SECURITY_STEP,
            );
            expect(findNextStep(STEP.ID_SECURITY_STEP, createSteps, defaultDevice)?.id).toBe(
                STEP.ID_SET_PIN_STEP,
            );
            expect(findNextStep(STEP.ID_SET_PIN_STEP, createSteps, defaultDevice)?.id).toBe(
                STEP.ID_COINS_STEP,
            );
            expect(findNextStep(STEP.ID_COINS_STEP, createSteps, defaultDevice)).toBe(null);
        });

        it('should skip PIN step when device already has pin protection', () => {
            const deviceWithPin = createDevice({
                internal_model: DeviceModelInternal.T2T1,
                pin_protection: true,
            });

            expect(findNextStep(STEP.ID_SECURITY_STEP, createSteps, deviceWithPin)?.id).toBe(
                STEP.ID_COINS_STEP,
            );
        });
    });

    describe('real onboarding flow - create wallet (T3T1)', () => {
        const deviceT3T1 = createDevice({
            internal_model: DeviceModelInternal.T3T1,
            major_version: 2,
            minor_version: 8,
            patch_version: 0,
            backup_availability: 'Required',
        } as Partial<AcquiredDevice['features']>);

        const createSteps = allSteps.filter(step =>
            isStepUsed(
                step,
                createProps({ onboardingPath: [STEP.PATH_CREATE], device: deviceT3T1 }),
            ),
        );

        it('should include authenticate and tutorial steps for T3T1', () => {
            const stepIds = createSteps.map(s => s.id);
            expect(stepIds).toContain(STEP.ID_AUTHENTICATE_DEVICE_STEP);
            expect(stepIds).toContain(STEP.ID_TUTORIAL_STEP);
        });

        it('should navigate through the full T3T1 create flow', () => {
            expect(findNextStep(STEP.ID_FIRMWARE_STEP, createSteps, deviceT3T1)?.id).toBe(
                STEP.ID_AUTHENTICATE_DEVICE_STEP,
            );
            expect(
                findNextStep(STEP.ID_AUTHENTICATE_DEVICE_STEP, createSteps, deviceT3T1)?.id,
            ).toBe(STEP.ID_TUTORIAL_STEP);
            expect(findNextStep(STEP.ID_TUTORIAL_STEP, createSteps, deviceT3T1)?.id).toBe(
                STEP.ID_CREATE_OR_RECOVER,
            );
        });
    });

    describe('real onboarding flow - recovery (T2T1)', () => {
        const recoverySteps = getStepsForPath(STEP.PATH_RECOVERY);

        it('should contain the expected steps for T2T1 recovery flow', () => {
            const stepIds = recoverySteps.map(s => s.id);
            expect(stepIds).toEqual([
                STEP.ID_FIRMWARE_STEP,
                STEP.ID_CREATE_OR_RECOVER,
                STEP.ID_RECOVERY_STEP,
                STEP.ID_SECURITY_STEP,
                STEP.ID_SET_PIN_STEP,
                STEP.ID_COINS_STEP,
            ]);
        });

        it('should navigate through the full recovery flow', () => {
            expect(findNextStep(STEP.ID_FIRMWARE_STEP, recoverySteps, defaultDevice)?.id).toBe(
                STEP.ID_CREATE_OR_RECOVER,
            );
            expect(findNextStep(STEP.ID_CREATE_OR_RECOVER, recoverySteps, defaultDevice)?.id).toBe(
                STEP.ID_RECOVERY_STEP,
            );
            expect(findNextStep(STEP.ID_RECOVERY_STEP, recoverySteps, defaultDevice)?.id).toBe(
                STEP.ID_SECURITY_STEP,
            );
        });
    });

    describe(findNextStep.name, () => {
        it('should return null when current step is not present in the steps list', () => {
            const createSteps = getStepsForPath(STEP.PATH_CREATE);
            expect(findNextStep(STEP.ID_RECOVERY_STEP, createSteps, defaultDevice)).toBe(null);
        });
    });

    describe(findPrevStep.name, () => {
        it('should find previous step', () => {
            const createSteps = getStepsForPath(STEP.PATH_CREATE);
            expect(findPrevStep(STEP.ID_CREATE_OR_RECOVER, createSteps)?.id).toBe(
                STEP.ID_FIRMWARE_STEP,
            );
        });

        it('should throw on improper use (no more step exists)', () => {
            const createSteps = getStepsForPath(STEP.PATH_CREATE);
            expect(() => findPrevStep(createSteps[0].id, createSteps)).toThrow(
                'no prev step exists',
            );
        });
    });

    describe(isStepUsed.name, () => {
        it('should exclude authenticate step when authenticity check is disabled', () => {
            const authenticateStep = allSteps.find(s => s.id === STEP.ID_AUTHENTICATE_DEVICE_STEP)!;
            const deviceT3T1 = createDevice({
                internal_model: DeviceModelInternal.T3T1,
                backup_availability: 'Required',
            } as Partial<AcquiredDevice['features']>);

            expect(
                isStepUsed(
                    authenticateStep,
                    createProps({
                        device: deviceT3T1,
                        isDeviceAuthenticityCheckEnabled: true,
                    }),
                ),
            ).toBe(true);

            expect(
                isStepUsed(
                    authenticateStep,
                    createProps({
                        device: deviceT3T1,
                        isDeviceAuthenticityCheckEnabled: false,
                    }),
                ),
            ).toBe(false);
        });

        it('should exclude tutorial step for unsupported models', () => {
            const tutorialStep = allSteps.find(s => s.id === STEP.ID_TUTORIAL_STEP)!;
            expect(isStepUsed(tutorialStep, createProps({ device: defaultDevice }))).toBe(false);

            const deviceT3B1 = createDevice({
                internal_model: DeviceModelInternal.T3B1,
                backup_availability: 'Required',
            } as Partial<AcquiredDevice['features']>);
            expect(isStepUsed(tutorialStep, createProps({ device: deviceT3B1 }))).toBe(true);
        });
    });
});
