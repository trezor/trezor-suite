import * as STEP from '@onboarding-constants/steps';
import { Step } from '@onboarding-types';
import { findNextStep, findPrevStep, isStepInPath } from '../steps';

const welcomeStep: Step = {
    id: STEP.ID_WELCOME_STEP,
    path: [],
    buy: false,
    help: false,
    progress: false,
};

const backupStep: Step = {
    id: STEP.ID_BACKUP_STEP,
    path: [],
    buy: false,
    help: false,
    progress: false,
};

const stepsMock = [welcomeStep, backupStep];

describe('steps', () => {
    describe('findNextStep', () => {
        it('should find next step', () => {
            expect(findNextStep(welcomeStep.id, stepsMock)).toEqual(backupStep);
        });

        it('should throw on improrper use (no more step exists)', () => {
            expect(() => findNextStep(backupStep.id, stepsMock)).toThrow('no next step exists');
        });
    });

    describe('findPrevStep', () => {
        it('should find previous step', () => {
            expect(findPrevStep(backupStep.id, stepsMock)).toEqual(welcomeStep);
        });

        it('should throw on improper use (no more step exists)', () => {
            expect(() => findPrevStep(welcomeStep.id, stepsMock)).toThrow('no prev step exists');
        });
    });

    describe('isStepInPath', () => {
        it('empty path means no restriction', () => {
            expect(isStepInPath(welcomeStep, [])).toEqual(true);
        });

        it('should return false for no overlap', () => {
            const step = welcomeStep;
            welcomeStep.path = ['create'];
            expect(isStepInPath(step, ['recovery'])).toEqual(false);
        });

        it('should return true for full overlap', () => {
            const step = welcomeStep;
            welcomeStep.path = ['create', 'new'];
            expect(isStepInPath(step, ['create', 'new'])).toEqual(true);
        });

        it('should return false for partial overlap', () => {
            const step = welcomeStep;
            welcomeStep.path = ['create', 'new'];
            expect(isStepInPath(step, ['recovery', 'new'])).toEqual(false);
        });
    });
});
