import { getYieldFlowSteps } from '../yieldFlowUtils';

describe('yieldFlowUtils', () => {
    describe('getYieldFlowSteps', () => {
        // A normal deposit lists only approve + action (the leading `wrap` step is native-only and
        // excluded from the list), so `wrap` shows as an out-of-flow (done, unnumbered) step.
        it('describes deposit steps on the approve step', () => {
            expect(getYieldFlowSteps('deposit', 'approve', ['approve', 'action'])).toEqual({
                wrap: { state: 'done', indicator: { index: 0, total: 2 } },
                approve: { state: 'active', indicator: { index: 1, total: 2 } },
                action: { state: 'pending', indicator: { index: 2, total: 2 } },
                complete: { state: 'pending', indicator: { index: 0, total: 2 } },
            });
        });

        it('describes deposit steps on the action step', () => {
            expect(getYieldFlowSteps('deposit', 'action', ['approve', 'action'])).toEqual({
                wrap: { state: 'done', indicator: { index: 0, total: 2 } },
                approve: { state: 'done', indicator: { index: 1, total: 2 } },
                action: { state: 'active', indicator: { index: 2, total: 2 } },
                complete: { state: 'pending', indicator: { index: 0, total: 2 } },
            });
        });

        it('describes deposit steps on the complete step', () => {
            expect(getYieldFlowSteps('deposit', 'complete', ['approve', 'action'])).toEqual({
                wrap: { state: 'done', indicator: { index: 0, total: 2 } },
                approve: { state: 'done', indicator: { index: 1, total: 2 } },
                action: { state: 'done', indicator: { index: 2, total: 2 } },
                complete: { state: 'active', indicator: { index: 0, total: 2 } },
            });
        });

        it('numbers the complete step when it is displayed as a list item', () => {
            expect(
                getYieldFlowSteps('deposit', 'approve', ['approve', 'action', 'complete']),
            ).toEqual({
                wrap: { state: 'done', indicator: { index: 0, total: 3 } },
                approve: { state: 'active', indicator: { index: 1, total: 3 } },
                action: { state: 'pending', indicator: { index: 2, total: 3 } },
                complete: { state: 'pending', indicator: { index: 3, total: 3 } },
            });
        });

        it('reports steps outside the flow as passed', () => {
            expect(getYieldFlowSteps('withdraw', 'action')).toEqual({
                wrap: { state: 'done', indicator: { index: 0, total: 1 } },
                approve: { state: 'done', indicator: { index: 0, total: 1 } },
                action: { state: 'active', indicator: { index: 1, total: 1 } },
                complete: { state: 'pending', indicator: { index: 0, total: 1 } },
            });
        });
    });
});
