import { TrezorDevice } from '@suite-common/suite-types';
import { DeviceModelInternal } from '@trezor/device-utils';

import * as STEP from 'src/constants/onboarding/steps';
import { Step } from 'src/types/onboarding';

import { IsStepUsedContext, findNextStep, findPrevStep, isStepUsed } from '../steps';

const firmwareStep: Step = {
    id: STEP.ID_FIRMWARE_STEP,
    path: [],
    stepGroup: undefined,
};

const backupStep: Step = {
    id: STEP.ID_BACKUP_STEP,
    path: [],
    stepGroup: 'wallet',
    supportedModels: [
        DeviceModelInternal.T2B1,
        { model: DeviceModelInternal.T3T1, minFwVersion: '2.8.0' },
    ],
};

const defaultDevice = {
    features: { internal_model: DeviceModelInternal.T1B1 },
} as TrezorDevice;

const contextMock: IsStepUsedContext = {
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
            expect(isStepUsed(firmwareStep, contextMock)).toEqual(true);
        });

        it('should return false for no overlap', () => {
            const step = firmwareStep;
            firmwareStep.path = ['create'];
            expect(isStepUsed(step, { ...contextMock, onboardingPath: ['recovery'] })).toEqual(
                false,
            );
        });

        it('should return true for full overlap', () => {
            const step = firmwareStep;
            firmwareStep.path = ['create'];
            expect(isStepUsed(step, { ...contextMock, onboardingPath: ['create'] })).toEqual(true);
        });

        it('should exclude steps not supported by device', () => {
            const deviceT2B1 = {
                features: { internal_model: DeviceModelInternal.T2B1 },
            } as TrezorDevice;
            expect(isStepUsed(backupStep, { ...contextMock, device: deviceT2B1 })).toEqual(true);

            const deviceT1B1 = {
                features: { internal_model: DeviceModelInternal.T1B1 },
            } as TrezorDevice;
            expect(isStepUsed(backupStep, { ...contextMock, device: deviceT1B1 })).toEqual(false);
        });

        it('should exclude steps not supported by firmware', () => {
            const deviceT3T1newer = {
                features: {
                    internal_model: DeviceModelInternal.T3T1,
                    major_version: 2,
                    minor_version: 8,
                    patch_version: 0,
                },
            } as TrezorDevice;
            expect(isStepUsed(backupStep, { ...contextMock, device: deviceT3T1newer })).toEqual(
                true,
            );

            const deviceT3T1older = {
                features: {
                    internal_model: DeviceModelInternal.T3T1,
                    major_version: 2,
                    minor_version: 7,
                    patch_version: 2,
                },
            } as TrezorDevice;
            expect(isStepUsed(backupStep, { ...contextMock, device: deviceT3T1older })).toEqual(
                false,
            );
        });
    });
});
