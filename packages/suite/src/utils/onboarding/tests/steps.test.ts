import * as STEP from '@onboarding-constants/steps';
import { Step } from '@onboarding-types/steps';
// import { OnboardingReducer } from '@onboarding-types/onboarding';
import { findNextStep, findPrevStep, isStepInPath } from '../steps';

const welcomeStep: Step = {
    id: STEP.ID_WELCOME_STEP,
    title: STEP.TITLE_WELCOME_STEP,
    path: [],
};

const backupStep: Step = {
    id: STEP.ID_BACKUP_STEP,
    title: STEP.TITLE_BACKUP_STEP,
    path: [],
};

const stepsMock = [welcomeStep, backupStep];

describe('steps', () => {
    describe('findNextStep', () => {
        it('should find next step', () => {
            expect(findNextStep(welcomeStep.id, stepsMock)).toEqual(backupStep);
        });
    });

    describe('findPrevStep', () => {
        it('should find previous step', () => {
            expect(findPrevStep(backupStep.id, stepsMock)).toEqual(welcomeStep);
        });
    });

    describe('isStepInPath', () => {
        it('empty path means no step should be found', () => {
            expect(isStepInPath(welcomeStep, [])).toEqual(false);
        });
    });
});
