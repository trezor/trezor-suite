import { DeviceModelInternal } from '@trezor/connect';

import * as STEP from 'src/constants/onboarding/steps';
import { Step } from 'src/types/onboarding';
import { findNextStep, findPrevStep, isStepUsed } from '../steps';

const firmwareStep: Step = {
    id: STEP.ID_FIRMWARE_STEP,
    path: [],
    stepGroup: undefined,
};

const backupStep: Step = {
    id: STEP.ID_BACKUP_STEP,
    path: [],
    stepGroup: 1,
    supportedModels: [DeviceModelInternal.T2B1],
};

const stateMock = {
    onboarding: {
        path: [],
    },
    device: {
        selectedDevice: {
            features: { internal_model: DeviceModelInternal.T1B1 },
        },
    },
    suite: { settings: { debug: { isUnlockedBootloaderAllowed: false } } },
} as any;

const stepsMock = [firmwareStep, backupStep];

describe('steps', () => {
    describe('findNextStep', () => {
        it('should find next step', () => {
            expect(findNextStep(firmwareStep.id, stepsMock)).toEqual(backupStep);
        });

        it('should throw on improrper use (no more step exists)', () => {
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
            expect(isStepUsed(firmwareStep, () => stateMock)).toEqual(true);
        });

        it('should return false for no overlap', () => {
            const step = firmwareStep;
            firmwareStep.path = ['create'];
            expect(
                isStepUsed(step, () => ({ ...stateMock, onboarding: { path: ['recovery'] } })),
            ).toEqual(false);
        });

        it('should return true for full overlap', () => {
            const step = firmwareStep;
            firmwareStep.path = ['create'];
            expect(
                isStepUsed(step, () => ({ ...stateMock, onboarding: { path: ['create'] } })),
            ).toEqual(true);
        });

        it('should exclude steps not supported by device', () => {
            expect(
                isStepUsed(backupStep, () => ({
                    ...stateMock,
                    device: {
                        selectedDevice: {
                            features: { internal_model: DeviceModelInternal.T2B1 },
                        },
                    },
                })),
            ).toEqual(true);
            expect(
                isStepUsed(backupStep, () => ({
                    ...stateMock,
                    device: {
                        selectedDevice: {
                            features: { internal_model: DeviceModelInternal.T1B1 },
                        },
                    },
                })),
            ).toEqual(false);
        });
    });
});
