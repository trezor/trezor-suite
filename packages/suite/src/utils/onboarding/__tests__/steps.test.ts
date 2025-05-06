import { AcquiredDevice } from '@suite-common/suite-types';
import { DeviceModelInternal, FirmwareType } from '@trezor/device-utils';

import * as STEP from 'src/constants/onboarding/steps';
import { Step, StepCategory } from 'src/types/onboarding';

import {
    IsStepUsedProps,
    findNextStep,
    findPrevStep,
    isStepCategoryUsed,
    isStepUsed,
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

const coinsStep: Step = {
    id: STEP.ID_COINS_STEP,
    supportedFirmwareTypes: [FirmwareType.Regular],
};

const stepCategory: StepCategory = {
    id: 'device',
    labelTranslationId: 'TR_DEVICE',
    steps: [firmwareStep],
};

const defaultDevice = {
    features: { internal_model: DeviceModelInternal.T1B1 },
    firmwareType: FirmwareType.Regular,
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
            expect(findNextStep(firmwareStep.id, stepsMock)).toEqual(backupStep);
        });

        it('should throw on improper use (no more step exists)', () => {
            expect(() => findNextStep(backupStep.id, stepsMock)).toThrow('no next step exists');
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
                features: { internal_model: DeviceModelInternal.T3B1 },
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
            const btcOnlyStep = {
                ...coinsStep,
                supportedFirmwareTypes: [FirmwareType.BitcoinOnly],
            };
            const propsBtcOnly = { ...propsMock, device: btcOnlyDevice };

            expect(isStepUsed(coinsStep, propsMock)).toEqual(true);
            expect(isStepUsed(btcOnlyStep, propsMock)).toEqual(false);
            expect(isStepUsed(coinsStep, propsBtcOnly)).toEqual(false);
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
                steps: [backupStep, coinsStep],
            };
            expect(isStepCategoryUsed(modifiedStepCategory, propsWithBtcOnlyT1B1)).toEqual(false);
        });
    });
});
