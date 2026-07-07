import { getYieldFlowSteps } from '../yieldFlowUtils';

describe('yieldFlowUtils', () => {
    describe('getYieldFlowSteps', () => {
        it('describes deposit steps on the approve step', () => {
            expect(getYieldFlowSteps('deposit', 'approve')).toEqual({
                approve: { state: 'active', indicator: { index: 1, total: 2 } },
                action: { state: 'pending', indicator: { index: 2, total: 2 } },
                complete: { state: 'pending', indicator: { index: 0, total: 2 } },
            });
        });

        it('describes deposit steps on the action step', () => {
            expect(getYieldFlowSteps('deposit', 'action')).toEqual({
                approve: { state: 'done', indicator: { index: 1, total: 2 } },
                action: { state: 'active', indicator: { index: 2, total: 2 } },
                complete: { state: 'pending', indicator: { index: 0, total: 2 } },
            });
        });

        it('describes deposit steps on the complete step', () => {
            expect(getYieldFlowSteps('deposit', 'complete')).toEqual({
                approve: { state: 'done', indicator: { index: 1, total: 2 } },
                action: { state: 'done', indicator: { index: 2, total: 2 } },
                complete: { state: 'active', indicator: { index: 0, total: 2 } },
            });
        });

        it('numbers the complete step when it is displayed as a list item', () => {
            expect(
                getYieldFlowSteps('deposit', 'approve', ['approve', 'action', 'complete']),
            ).toEqual({
                approve: { state: 'active', indicator: { index: 1, total: 3 } },
                action: { state: 'pending', indicator: { index: 2, total: 3 } },
                complete: { state: 'pending', indicator: { index: 3, total: 3 } },
            });
        });

        it('reports steps outside the flow as passed', () => {
            expect(getYieldFlowSteps('withdraw', 'action')).toEqual({
                approve: { state: 'done', indicator: { index: 0, total: 1 } },
                action: { state: 'active', indicator: { index: 1, total: 1 } },
                complete: { state: 'pending', indicator: { index: 0, total: 1 } },
            });
        });
    });
});
