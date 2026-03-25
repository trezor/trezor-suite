import { type AcquiredDevice } from '@suite-common/suite-types';
import { DeviceModelInternal, FirmwareType } from '@trezor/device-utils';

import * as STEP from 'src/constants/onboarding/steps';
import { type Step, type StepCategory } from 'src/types/onboarding';

import {
    type IsStepUsedProps,
    findNextStep,
    findPrevStep,
    isStepCategoryUsed,
    isStepUsed,
    resolveNextAvailableStep,
} from '../steps';

const firmwareStep: Step = {
    id: STEP.ID_FIRMWARE_STEP,
    path: [],
};

const backupStep: Step = {
    id: STEP.ID_BACKUP_STEP,
    path: [],
    supportedModels: [
        DeviceModelInternal.T3B1,
        { model: DeviceModelInternal.T3T1, minFwVersion: '2.8.0' },
    ],
};

const stepCategory: StepCategory = {
    id: 'device',
    labelTranslationId: 'TR_DEVICE',
    steps: [firmwareStep],
};

const defaultDevice = {
    features: { internal_model: DeviceModelInternal.T1B1 },
    firmwareType: FirmwareType.Universal,
} as AcquiredDevice;

const propsMock: IsStepUsedProps = {
    onboardingPath: [],
    device: defaultDevice,
    isDeviceAuthenticityCheckEnabled: true,
    isUnlockedBootloaderAllowed: false,
};

const stepsMock = [firmwareStep, backupStep];

describe('steps', () => {
    describe(findNextStep.name, () => {
        it('should find next step', () => {
            const device = {
                ...defaultDevice,
                features: {
                    internal_model: DeviceModelInternal.T2T1,
                    backup_availability: 'Required',
                },
            } as AcquiredDevice;

            expect(findNextStep(firmwareStep.id, stepsMock, device)).toEqual(backupStep);
        });

        it('should return null in no next step exists', () => {
            expect(findNextStep(backupStep.id, stepsMock, defaultDevice)).toBe(null);
        });
    });

    describe(findPrevStep.name, () => {
        it('should find previous step', () => {
            expect(findPrevStep(backupStep.id, stepsMock)).toEqual(firmwareStep);
        });

        it('should throw on improper use (no more step exists)', () => {
            expect(() => findPrevStep(firmwareStep.id, stepsMock)).toThrow('no prev step exists');
        });
    });

    describe(isStepUsed.name, () => {
        it('empty path means no restriction', () => {
            expect(isStepUsed(firmwareStep, propsMock)).toEqual(true);
        });

        it('should return false for no overlap', () => {
            const stepWithPath: Step = { ...firmwareStep, path: ['create'] };
            const propsWithPath: IsStepUsedProps = { ...propsMock, onboardingPath: ['recovery'] };
            expect(isStepUsed(stepWithPath, propsWithPath)).toEqual(false);
        });

        it('should return true for full overlap', () => {
            const stepWithPath: Step = { ...firmwareStep, path: ['create'] };
            const propsWithPath: IsStepUsedProps = { ...propsMock, onboardingPath: ['create'] };
            expect(isStepUsed(stepWithPath, propsWithPath)).toEqual(true);
        });

        it('should exclude steps not supported by device', () => {
            const deviceT3B1 = {
                features: {
                    internal_model: DeviceModelInternal.T3B1,
                    backup_availability: 'Required',
                },
            } as AcquiredDevice;
            const propsWithT3B1 = { ...propsMock, device: deviceT3B1 };
            expect(isStepUsed(backupStep, propsWithT3B1)).toEqual(true);

            const deviceT1B1 = {
                features: { internal_model: DeviceModelInternal.T1B1 },
            } as AcquiredDevice;
            const propsWithT1B1 = { ...propsMock, device: deviceT1B1 };
            expect(isStepUsed(backupStep, propsWithT1B1)).toEqual(false);
        });

        it('should exclude steps not supported by firmware', () => {
            const deviceT3T1newer = {
                features: {
                    internal_model: DeviceModelInternal.T3T1,
                    major_version: 2,
                    minor_version: 8,
                    patch_version: 0,
                    backup_availability: 'Required',
                },
            } as AcquiredDevice;
            const propsNewerT3T1 = { ...propsMock, device: deviceT3T1newer };
            expect(isStepUsed(backupStep, propsNewerT3T1)).toEqual(true);

            const deviceT3T1older = {
                features: {
                    internal_model: DeviceModelInternal.T3T1,
                    major_version: 2,
                    minor_version: 7,
                    patch_version: 2,
                },
            } as AcquiredDevice;
            const propsOlderT3T1 = { ...propsMock, device: deviceT3T1older };
            expect(isStepUsed(backupStep, propsOlderT3T1)).toEqual(false);
        });

        it('should exclude steps as per firmware type', () => {
            const btcOnlyDevice = { ...defaultDevice, firmwareType: FirmwareType.BitcoinOnly };
            const universalStep: Step = {
                id: STEP.ID_SET_PIN_STEP,
                supportedFirmwareTypes: [FirmwareType.Universal],
            };
            const btcOnlyStep: Step = {
                id: STEP.ID_SET_PIN_STEP,
                supportedFirmwareTypes: [FirmwareType.BitcoinOnly],
            };
            const propsBtcOnly = { ...propsMock, device: btcOnlyDevice };

            expect(isStepUsed(universalStep, propsMock)).toEqual(true);
            expect(isStepUsed(btcOnlyStep, propsMock)).toEqual(false);
            expect(isStepUsed(universalStep, propsBtcOnly)).toEqual(false);
            expect(isStepUsed(btcOnlyStep, propsBtcOnly)).toEqual(true);
        });
    });

    describe(isStepCategoryUsed.name, () => {
        it('should return true for category with at least one valid step', () => {
            expect(isStepCategoryUsed(stepCategory, propsMock)).toEqual(true);
        });

        it('should return false for category with no steps', () => {
            const modifiedStepCategory: StepCategory = { ...stepCategory, steps: [] };
            expect(isStepCategoryUsed(modifiedStepCategory, propsMock)).toEqual(false);
        });

        it('should return false for category with only irrelevant steps', () => {
            const deviceBtcOnlyT1B1 = {
                firmwareType: FirmwareType.BitcoinOnly,
                features: {
                    internal_model: DeviceModelInternal.T3T1,
                    major_version: 1,
                    minor_version: 12,
                    patch_version: 1,
                },
            } as AcquiredDevice;
            const propsWithBtcOnlyT1B1 = { ...propsMock, device: deviceBtcOnlyT1B1 };

            const modifiedStepCategory: StepCategory = {
                ...stepCategory,
                steps: [backupStep],
            };
            expect(isStepCategoryUsed(modifiedStepCategory, propsWithBtcOnlyT1B1)).toEqual(false);
        });
    });

    describe(resolveNextAvailableStep.name, () => {
        const setPinStep: Step = { id: STEP.ID_SET_PIN_STEP, path: [] };
        const backupStepInSteps: Step = { id: STEP.ID_BACKUP_STEP, path: [] };

        const steps: Step[] = [backupStepInSteps, setPinStep];

        it('should return requested step if it is accessible', () => {
            const device = {
                ...defaultDevice,
                features: {
                    internal_model: DeviceModelInternal.T2T1,
                    pin_protection: false,
                    backup_availability: 'Required',
                },
            } as AcquiredDevice;

            expect(resolveNextAvailableStep(STEP.ID_SET_PIN_STEP, steps, device)).toEqual(
                setPinStep,
            );
        });

        it('should skip PIN step when pin protection is already set', () => {
            const device = {
                ...defaultDevice,
                features: {
                    internal_model: DeviceModelInternal.T2T1,
                    pin_protection: true,
                    backup_availability: 'Required',
                },
            } as AcquiredDevice;

            expect(resolveNextAvailableStep(STEP.ID_SET_PIN_STEP, steps, device)).toEqual(null);
        });

        it('should NOT skip Backup step when device does not require backup - you cant do backup on the device', () => {
            const device = {
                ...defaultDevice,
                features: {
                    internal_model: DeviceModelInternal.T2T1,
                    pin_protection: false,
                    backup_availability: 'Available',
                },
            } as AcquiredDevice;

            expect(resolveNextAvailableStep(STEP.ID_BACKUP_STEP, steps, device)).toEqual(
                backupStepInSteps,
            );
        });

        it('should return null when requested step is not in steps list', () => {
            expect(resolveNextAvailableStep(STEP.ID_FIRMWARE_STEP, steps, defaultDevice)).toEqual(
                null,
            );
        });
    });

    describe(findNextStep.name, () => {
        it('should return null when current step is not present in the steps list', () => {
            // This may happen when a step becomes unused right after it is completed (e.g. backup step is removed
            // from available steps once the device no longer requires backup). In that case returning the first step
            // (firmware) would incorrectly restart onboarding.
            const steps: Step[] = [
                { id: STEP.ID_FIRMWARE_STEP, path: [] },
                { id: STEP.ID_SECURITY_STEP, path: [] },
                { id: STEP.ID_SET_PIN_STEP, path: [] },
            ];

            // Without the `currentIndex === -1` guard this would incorrectly return `steps[0]` (firmware).
            expect(findNextStep(STEP.ID_BACKUP_STEP, steps, defaultDevice)).toEqual(null);
            expect(findNextStep(STEP.ID_BACKUP_STEP, steps, defaultDevice)).not.toEqual(steps[0]);
        });
    });
});
