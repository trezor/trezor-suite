import { AcquiredDevice } from '@suite-common/suite-types';
import { DeviceModelInternal, FirmwareType } from '@trezor/device-utils';

import * as STEP from 'src/constants/onboarding/steps';
import { Step } from 'src/types/onboarding';

import { IsStepUsedProps, findNextStep, findPrevStep, isStepUsed } from '../steps';

const firmwareStep: Step = {
    id: STEP.ID_FIRMWARE_STEP,
    path: [],
};

const backupStep: Step = {
    id: STEP.ID_BACKUP_STEP,
    path: [],
    supportedModels: [
        DeviceModelInternal.T2B1,
        { model: DeviceModelInternal.T3T1, minFwVersion: '2.8.0' },
    ],
};

const coinsStep: Step = {
    id: STEP.ID_COINS_STEP,
    supportedFirmwareTypes: [FirmwareType.Regular],
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
    describe('findNextStep', () => {
        it('should find next step', () => {
            expect(findNextStep(firmwareStep.id, stepsMock)).toEqual(backupStep);
        });

        it('should throw on improper use (no more step exists)', () => {
            expect(() => findNextStep(backupStep.id, stepsMock)).toThrow('no next step exists');
        });
    });

    describe('findPrevStep', () => {
        it('should find previous step', () => {
            expect(findPrevStep(backupStep.id, stepsMock)).toEqual(firmwareStep);
        });

        it('should throw on improper use (no more step exists)', () => {
            expect(() => findPrevStep(firmwareStep.id, stepsMock)).toThrow('no prev step exists');
        });
    });

    describe('isStepUsed', () => {
        it('empty path means no restriction', () => {
            expect(isStepUsed(firmwareStep, propsMock)).toEqual(true);
        });

        it('should return false for no overlap', () => {
            const step = { ...firmwareStep };
            firmwareStep.path = ['create'];
            expect(isStepUsed(step, { ...propsMock, onboardingPath: ['recovery'] })).toEqual(false);
        });

        it('should return true for full overlap', () => {
            const step = { ...firmwareStep };
            firmwareStep.path = ['create'];
            expect(isStepUsed(step, { ...propsMock, onboardingPath: ['create'] })).toEqual(true);
        });

        it('should exclude steps not supported by device', () => {
            const deviceT2B1 = {
                features: { internal_model: DeviceModelInternal.T2B1 },
            } as AcquiredDevice;
            expect(isStepUsed(backupStep, { ...propsMock, device: deviceT2B1 })).toEqual(true);

            const deviceT1B1 = {
                features: { internal_model: DeviceModelInternal.T1B1 },
            } as AcquiredDevice;
            expect(isStepUsed(backupStep, { ...propsMock, device: deviceT1B1 })).toEqual(false);
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
            expect(isStepUsed(backupStep, { ...propsMock, device: deviceT3T1newer })).toEqual(true);

            const deviceT3T1older = {
                features: {
                    internal_model: DeviceModelInternal.T3T1,
                    major_version: 2,
                    minor_version: 7,
                    patch_version: 2,
                },
            } as AcquiredDevice;
            expect(isStepUsed(backupStep, { ...propsMock, device: deviceT3T1older })).toEqual(
                false,
            );
        });

        it('should exclude steps as per firmware type', () => {
            const btcOnlyDevice = { ...defaultDevice, firmwareType: FirmwareType.BitcoinOnly };
            const btcOnlyStep = {
                ...coinsStep,
                supportedFirmwareTypes: [FirmwareType.BitcoinOnly],
            };

            expect(isStepUsed(coinsStep, propsMock)).toEqual(true);
            expect(isStepUsed(btcOnlyStep, propsMock)).toEqual(false);
            expect(isStepUsed(coinsStep, { ...propsMock, device: btcOnlyDevice })).toEqual(false);
            expect(isStepUsed(btcOnlyStep, { ...propsMock, device: btcOnlyDevice })).toEqual(true);
        });
    });
});
