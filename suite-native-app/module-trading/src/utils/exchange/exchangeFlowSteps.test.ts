import {
    getExchangeApprovalFlowStatus,
    getExchangeFlowStepCards,
    getExchangeFlowSteps,
} from './exchangeFlowSteps';

describe('getExchangeFlowSteps', () => {
    it.each([
        ['needs_revoke', ['revoke', 'approval', 'preview']],
        ['needs_increase', ['approval', 'preview']],
        ['needs_approval', ['approval', 'preview']],
    ] as const)('returns steps for %s', (approvalStatus, expectedSteps) => {
        expect(getExchangeFlowSteps(approvalStatus)).toEqual(expectedSteps);
    });
});

describe('getExchangeApprovalFlowStatus', () => {
    it.each([
        [{}, 'needs_approval'],
        [{ shouldIncreaseLimit: true }, 'needs_increase'],
        [{ isRevoked: true }, 'needs_revoke'],
        [{ isRevoked: true, shouldIncreaseLimit: true }, 'needs_revoke'],
    ] as const)('returns the approval status for %o', (params, expectedApprovalStatus) => {
        expect(getExchangeApprovalFlowStatus(params)).toBe(expectedApprovalStatus);
    });
});

describe('getExchangeFlowStepCards', () => {
    it('defaults to the first step without a finished step', () => {
        expect(
            getExchangeFlowStepCards({ approvalStatus: 'needs_revoke', currentStep: undefined }),
        ).toEqual({
            lastFinishedStep: undefined,
            currentStep: 'revoke',
            currentStepNumber: 1,
            stepCount: 3,
            nextSteps: [
                { step: 'approval', stepNumber: 2 },
                { step: 'preview', stepNumber: 3 },
            ],
        });
    });

    it('returns the previous step as finished in the middle of the flow', () => {
        expect(
            getExchangeFlowStepCards({ approvalStatus: 'needs_revoke', currentStep: 'approval' }),
        ).toEqual({
            lastFinishedStep: 'revoke',
            currentStep: 'approval',
            currentStepNumber: 2,
            stepCount: 3,
            nextSteps: [{ step: 'preview', stepNumber: 3 }],
        });
    });

    it('returns only the last finished step and no next steps at the end of the flow', () => {
        expect(
            getExchangeFlowStepCards({ approvalStatus: 'needs_revoke', currentStep: 'preview' }),
        ).toEqual({
            lastFinishedStep: 'approval',
            currentStep: 'preview',
            currentStepNumber: 3,
            stepCount: 3,
            nextSteps: [],
        });
    });

    it('returns the approval as finished when swapping after an approval', () => {
        expect(
            getExchangeFlowStepCards({ approvalStatus: 'needs_approval', currentStep: 'preview' }),
        ).toEqual({
            lastFinishedStep: 'approval',
            currentStep: 'preview',
            currentStepNumber: 2,
            stepCount: 2,
            nextSteps: [],
        });
    });

    it('falls back to the first step when the step is not part of the flow', () => {
        expect(
            getExchangeFlowStepCards({ approvalStatus: 'needs_increase', currentStep: 'revoke' }),
        ).toEqual({
            lastFinishedStep: undefined,
            currentStep: 'approval',
            currentStepNumber: 1,
            stepCount: 2,
            nextSteps: [{ step: 'preview', stepNumber: 2 }],
        });
    });
});
